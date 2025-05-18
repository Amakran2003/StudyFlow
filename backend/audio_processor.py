import subprocess
import os
import logging
import re
import threading
import queue
from typing import Callable, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("audio_processor")

def _reader_thread(pipe: subprocess.PIPE, progress_queue: queue.Queue):
    try:
        with pipe:
            for line in iter(pipe.readline, ''):
                progress_queue.put(line)
    finally:
        progress_queue.put(None)

def get_audio_duration(file_path: str) -> float:
    """Get the duration of an audio file in seconds using ffprobe"""
    try:
        cmd = [
            'ffprobe', 
            '-v', 'quiet',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            file_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return float(result.stdout.strip())
    except Exception as e:
        logger.error(f"Failed to get audio duration: {e}")
        return 0.0

def transcribe_audio(file_path: str, progress_callback: Optional[Callable[[int], None]] = None) -> str:
    """
    Transcribes an audio file using the Whisper.cpp binary.
    
    Parameters:
        file_path (str): Path to the audio file.
        progress_callback (callable): Optional callback function that receives progress updates (0-100).
    
    Returns:
        str: The transcription text.
    """
    # Get absolute paths
    binary_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 
                                              "whisper.cpp", "build", "bin", "whisper-cli"))
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 
                                            "models", "large-v3-turbo.bin"))
    abs_file_path = os.path.abspath(file_path)

    # Check if files exist
    for path, desc in [(binary_path, "Binary"), (model_path, "Model"), (abs_file_path, "Audio file")]:
        if not os.path.exists(path):
            error = f"{desc} not found at: {path}"
            logger.error(error)
            raise FileNotFoundError(error)

    # Get audio duration for progress estimation
    audio_duration = get_audio_duration(file_path)
    if audio_duration <= 0:
        logger.warning("Could not determine audio duration, progress updates may be inaccurate")

    # Create queues for inter-thread communication    
    progress_queue = queue.Queue()
    output_queue = queue.Queue()

    # Send initial progress
    if progress_callback:
        progress_callback(0)
        logger.info("Sent initial progress: 0%")

    # Start the transcription process
    try:
        logger.info(f"Starting transcription of {abs_file_path} (duration: {audio_duration:.2f}s)")
        cmd = [
            binary_path,
            "-m", model_path,
            "-f", abs_file_path,
            "-otxt",      # Output in plain text format
            "-l", "auto", # Auto language detection
            "--print-progress"
        ]
        
        logger.debug(f"Running command: {' '.join(cmd)}")
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
            bufsize=1,
            text=True
        )

        # Start reader threads for stdout and stderr
        stdout_thread = threading.Thread(target=_reader_thread, args=(process.stdout, output_queue))
        stderr_thread = threading.Thread(target=_reader_thread, args=(process.stderr, progress_queue))
        stdout_thread.daemon = True
        stderr_thread.daemon = True
        stdout_thread.start()
        stderr_thread.start()

        # Monitor progress and transcription output
        transcription = []
        last_progress = 0
        # Progress pattern matching both the segment progress and overall progress
        segment_pattern = re.compile(r"\[(\d+)%\]")  # Matches [XX%]
        full_pattern = re.compile(r"whisper_print_progress_callback: progress = (\d+)%")
        
        # Send initial progress
        if progress_callback:
            progress_callback(0)
            logger.info("Sent initial progress: 0%")

        done_reading = False
        error_occurred = False
        
        while not done_reading:
            # Check for progress updates
            try:
                progress_line = progress_queue.get(timeout=0.1)  # Small timeout to be responsive
                if progress_line is None:
                    done_reading = True
                    continue

                # Log the raw progress line for debugging
                logger.debug(f"Progress line: {progress_line.strip()}")
                
                # Check for error messages
                if "error" in progress_line.lower():
                    error_occurred = True
                    logger.error(f"Transcription error: {progress_line.strip()}")
                
                progress = None

                # Parse progress information from different patterns
                if "whisper_print_progress_callback: progress = " in progress_line:
                    try:
                        progress = int(progress_line.split("=")[1].strip().rstrip("%"))
                    except:
                        progress = None
                # Check for completion patterns
                elif "finish" in progress_line.lower() or "done" in progress_line.lower():
                    progress = 100
                # Check for major processing stages with smoother transitions
                elif "loading model" in progress_line.lower():
                    progress = 5
                elif "system info" in progress_line.lower():
                    progress = 10
                elif "initializing" in progress_line.lower():
                    progress = 15
                elif "mel" in progress_line.lower():
                    progress = 20
                elif "encode" in progress_line.lower():
                    progress = 30
                # More granular progress during decode phase
                elif "decode" in progress_line.lower():
                    if "layer" in progress_line.lower():
                        try:
                            layer_num = int(re.search(r"layer\s*(\d+)", progress_line.lower()).group(1))
                            # Map layer progress from 35-45%
                            progress = 35 + min(10, int((layer_num / 32) * 10))  # Assuming 32 layers
                        except:
                            progress = 35
                    else:
                        progress = 35
                # Parse timestamps for incremental progress during main transcription
                elif "[" in progress_line and "]" in progress_line and audio_duration > 0:
                    try:
                        # Extract timestamp [MM:SS.mmm]
                        time_match = re.search(r"\[(\d{2}):(\d{2})\.(\d{3})\]", progress_line)
                        if time_match:
                            minutes, seconds, _ = map(int, time_match.groups())
                            current_time = minutes * 60 + seconds
                            # Map time progress to 45-95% range during transcription
                            # Use a more granular progress calculation
                            progress = min(95, 45 + int((current_time / audio_duration) * 50))
                    except Exception as e:
                        logger.debug(f"Error parsing timestamp: {e}")
                        progress = None

                if progress is not None and progress_callback:
                    # Allow small decrements for more accurate progress
                    if progress >= last_progress - 2:  # Allow 2% backtracking for smoother updates
                        progress_callback(progress)
                        last_progress = progress
                        logger.info(f"Progress update: {progress}%")
            except queue.Empty:
                # No new progress data, check if process is still running
                if not (stdout_thread.is_alive() or stderr_thread.is_alive()):
                    done_reading = True

            # Check for transcription output
            try:
                output_line = output_queue.get_nowait()
                if output_line is None:
                    break
                transcription.append(output_line)
            except queue.Empty:
                pass

        # Send 100% progress if we haven't already
        if progress_callback and last_progress < 100:
            progress_callback(100)
            logger.info("Sent final progress: 100%")

        # Wait for process to complete and get return code
        return_code = process.wait()
        
        # Check process result and output
        if return_code == 0:
            # Success case - process completed normally
            result = "".join(transcription).strip()
            if result:
                logger.info("Transcription completed successfully")
                return result
            else:
                error = "Transcription completed but no output was generated"
                logger.error(error)
                raise RuntimeError(error)
        else:
            # Error case - process failed
            error = f"Transcription failed with return code {return_code}"
            if error_occurred:
                error += " - error messages were logged"
            logger.error(error)
            raise RuntimeError(error)

    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}")
        raise
