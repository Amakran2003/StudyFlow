import os
import asyncio
import logging
import signal
import subprocess
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware

# Import relative modules
from audio_processor import transcribe_audio
from summarizer import generate_bullet_summary, generate_detailed_summary
from websocket_manager import WebSocketManager
from file_handler import FileHandler

# Create FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Development frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("main")

# Initialize managers
ws_manager = WebSocketManager()
file_handler = FileHandler(os.path.dirname(os.path.abspath(__file__)))

async def shutdown():
    """Gracefully shut down the application"""
    logger.info("Initiating graceful shutdown...")
    file_handler.cleanup()
    ws_manager.shutdown_event.set()

def signal_handler(signum, frame):
    """Handle shutdown signals by scheduling the shutdown coroutine"""
    logger.info(f"Received signal {signum}. Initiating graceful shutdown...")
    loop = asyncio.get_event_loop()
    loop.create_task(shutdown())

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def convert_to_16khz_wav(input_path: str, output_path: str) -> bool:
    """
    Convert audio file to 16kHz mono WAV using ffmpeg.
    """
    try:
        command = [
            "ffmpeg",
            "-i", input_path,
            "-ar", "16000",  # Set sample rate to 16kHz
            "-ac", "1",      # Convert to mono
            "-acodec", "pcm_s16le",  # 16-bit output
            "-y",           # Overwrite output file if exists
            output_path
        ]
        
        logger.info(f"Running ffmpeg command: {' '.join(command)}")
        
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if result.returncode != 0:
            logger.error(f"FFmpeg conversion failed: {result.stderr}")
            return False
            
        return True
    except Exception as e:
        logger.error(f"Error during audio conversion: {str(e)}")
        return False

def clean_transcript(transcript: str) -> str:
    """
    Supprime les repères temporels au format [HH:MM:SS.mmm --> HH:MM:SS.mmm] du transcript.
    """
    # First, check if we have content
    if not transcript:
        return ""
        
    # Remove timestamp lines and clean up
    lines = transcript.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Skip empty lines and pure timestamp lines
        if not line.strip() or re.match(r'^\[\d{2}:\d{2}:\d{2}\.\d{3} -->', line):
            continue
            
        # Remove timestamps from lines that have them
        line = re.sub(r'\[\d{2}:\d{2}:\d{2}\.\d{3} -->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]\s*', '', line)
        
        # Remove music markers if present
        line = re.sub(r'\*.*?\*', '', line)
        
        # Add non-empty cleaned lines
        if line.strip():
            cleaned_lines.append(line.strip())
    
    return '\n'.join(cleaned_lines)

@app.post("/transcribe/")
async def transcribe(
    file: UploadFile = File(...),
    enable_summary: bool = Form(False),
    api_key: Optional[str] = Form(None),
    client_id: str = Form(...)  # New: require client_id for WebSocket updates
):
    temp_files = []  # Keep track of temporary files for cleanup
    results_folder = os.path.join(os.path.dirname(__file__), "results")
    os.makedirs(results_folder, exist_ok=True)

    logger.info(f"Starting transcription for client {client_id}")
    
    try:
        # Save uploaded file temporarily
        audio_path = os.path.join(os.path.dirname(__file__), f"temp_{uuid.uuid4()}.wav")
        temp_files.append(audio_path)
        
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        loop = asyncio.get_event_loop()

        async def progress_callback(progress: int):
            try:
                await send_progress(client_id, progress)
            except Exception as e:
                logger.error(f"Failed to send progress update: {str(e)}")
                # Don't re-raise here to allow transcription to continue even if WebSocket fails
        
        # Create a queue for progress updates
        progress_queue = asyncio.Queue()
        
        # Create a wrapper that can be called from sync code
        def sync_progress_callback(progress: int):
            try:
                # Just put the progress in the queue instead of trying to run the coroutine directly
                loop.call_soon_threadsafe(progress_queue.put_nowait, progress)
            except Exception as e:
                logger.error(f"Failed to queue progress update: {str(e)}")
        
        # Start progress monitoring task with rate limiting
        last_update_time = 0
        last_sent_progress = 0
        
        async def monitor_progress():
            nonlocal last_update_time, last_sent_progress
            try:
                while True:
                    try:
                        progress = await progress_queue.get()
                        logger.debug(f"Monitor received progress: {progress}%")
                        
                        # Rate limit updates to max 10 per second and ensure meaningful changes
                        current_time = asyncio.get_event_loop().time()
                        time_since_last = current_time - last_update_time
                        progress_change = abs(progress - last_sent_progress)
                        
                        if (time_since_last >= 0.1 or progress_change >= 2) and client_id in active_connections:
                            await progress_callback(progress)
                            last_update_time = current_time
                            last_sent_progress = progress
                        else:
                            logger.debug(f"Skipping progress update due to rate limiting or small change")
                        progress_queue.task_done()
                    except asyncio.CancelledError:
                        raise
                    except Exception as e:
                        logger.error(f"Error processing progress update: {str(e)}")
            except asyncio.CancelledError:
                logger.debug("Progress monitoring cancelled")
            except Exception as e:
                logger.error(f"Fatal error in progress monitoring: {str(e)}")

        # Start the monitoring task
        monitor_task = asyncio.create_task(monitor_progress())
        logger.info(f"Started progress monitoring for client {client_id}")
        
        try:
            # Run transcription with progress updates
            transcription = transcribe_audio(audio_path, progress_callback=sync_progress_callback)
        finally:
            # Clean up the monitoring task
            logger.debug("Cleaning up progress monitoring")
            monitor_task.cancel()
            try:
                await asyncio.wait_for(monitor_task, timeout=1.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                pass  # Expected during cleanup
        
        # Create timestamped filename for transcript
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Process timestamps from transcription
        text_with_timestamps = transcription
        # Extract plain text for summary if needed
        plain_text = re.sub(r'\[\d{2}:\d{2}:\d{2}\] ', '', transcription)
        
        final_result = {
            "transcription": text_with_timestamps
        }
        
        if enable_summary and api_key:
            if len(plain_text.strip()) < 10:
                raise ValueError("Text too short to generate summary")
            
            bullet_summary = await generate_bullet_summary(plain_text, api_key)
            logger.info("Generated bullet summary")
            final_result["petitResume"] = bullet_summary
            
            detailed_summary = await generate_detailed_summary(plain_text, bullet_summary, api_key)
            logger.info("Generated detailed summary")
            final_result["grosResume"] = detailed_summary

        # Save markdown version
        markdown_content = f"""# Transcription {timestamp}
### Transcription:
{text_with_timestamps}
"""
        if "petitResume" in final_result:
            markdown_content += f"""
### Key Points:
{final_result['petitResume']}
"""
        if "grosResume" in final_result:
            markdown_content += f"""
### Detailed Summary:
{final_result['grosResume']}
"""

        # Save results
        output_path_json = os.path.join(results_folder, f"result_{timestamp}.json")
        with open(output_path_json, "w", encoding="utf-8") as f:
            json.dump(final_result, f, ensure_ascii=False, indent=4)
        logger.info(f"JSON saved to: {output_path_json}")
        
        output_path_md = os.path.join(results_folder, f"result_{timestamp}.md")
        with open(output_path_md, "w", encoding="utf-8") as f:
            f.write(markdown_content)
        logger.info(f"Markdown saved to: {output_path_md}")

        return final_result

    except Exception as e:
        logger.error(f"Error in transcribe endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up all temporary files
        for temp_file in temp_files:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                    logger.info(f"Temporary file removed: {temp_file}")
                except Exception as e:
                    logger.warning(f"Failed to remove temporary file {temp_file}: {str(e)}")
        
        transcribe_task.audio_duration = None  # Clean up audio duration after transcription is done

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time progress updates"""
    try:
        await websocket.accept()
        logger.info(f"WebSocket connection established for client {client_id}")
        
        # If there's an existing connection for this client, close it
        if client_id in active_connections:
            try:
                await active_connections[client_id].close()
                logger.info(f"Closed existing connection for client {client_id}")
            except:
                pass
        
        # Store the new connection
        active_connections[client_id] = websocket
        
        # Send initial test message with audio duration
        await websocket.send_json({
            "type": "connected",
            "message": "WebSocket connection established",
            "audioInfo": {
                "duration": getattr(transcribe_task, 'audio_duration', None)
            }
        })
        await websocket.send_json({
            "type": "progress",
            "value": 0,
            "duration": getattr(transcribe_task, 'audio_duration', None),
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        try:
            last_activity = asyncio.get_event_loop().time()
            while not shutdown_event.is_set():
                current_time = asyncio.get_event_loop().time()
                try:
                    data = await asyncio.wait_for(
                        websocket.receive_json(),
                        timeout=35.0  # Slightly longer than ping interval
                    )
                    if data.get('type') == 'ping':
                        # Only send pong response if we haven't had other activity recently
                        if current_time - last_activity >= 25.0:
                            await websocket.send_json({"type": "pong"})
                            logger.debug(f"Received ping from {client_id}, connection alive")
                        last_activity = current_time
                except asyncio.TimeoutError:
                    # Check if connection is still alive
                    if current_time - last_activity >= 60.0:  # No activity for 60 seconds
                        logger.warning(f"Connection timeout for client {client_id}")
                        break
                    continue
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for client {client_id}")
        except Exception as e:
            logger.error(f"WebSocket error for client {client_id}: {str(e)}")
    finally:
        active_connections.pop(client_id, None)
        logger.info(f"Cleaned up connection for client {client_id}")

async def send_progress(client_id: str, progress: int):
    """Send progress updates to the client"""
    logger.debug(f"Attempting to send progress {progress}% to client {client_id}")
    
    if client_id not in active_connections:
        logger.warning(f"No active connection found for client {client_id}")
        return
        
    try:
        websocket = active_connections[client_id]
        # Ensure progress is a valid integer between 0 and 100
        normalized_progress = max(0, min(100, int(progress)))
        
        message = {
            "type": "progress",
            "value": normalized_progress,
            "duration": getattr(transcribe_task, 'audio_duration', None),
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        logger.debug(f"Progress update: {normalized_progress}%")
        # Send progress update without additional keepalive
        await websocket.send_text(json.dumps(message))
        
        logger.info(f"Successfully sent progress {normalized_progress}% to client {client_id}")
    except WebSocketDisconnect:
        logger.warning(f"WebSocket disconnected for client {client_id} while sending progress")
        active_connections.pop(client_id, None)
    except Exception as e:
        logger.error(f"Error sending progress to client {client_id}: {str(e)}")
        active_connections.pop(client_id, None)
