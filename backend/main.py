import os
import re
import json
import uuid
import shutil
import datetime
import asyncio
import logging
import subprocess
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("main")

# Importations relatives, puisque ce fichier est exécuté depuis le dossier backend.
from audio_processor import transcribe_audio
from summarizer import generate_bullet_summary, generate_detailed_summary

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:5173",  # React Vite dev server
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    api_key: Optional[str] = Form(None)
):
    """
    Endpoint pour transcrire un fichier audio, générer en parallèle un petit résumé (points clés)
    et un gros résumé détaillé, exporter le tout dans des fichiers JSON et Markdown,
    puis supprimer le fichier audio temporaire.
    """
    temp_files = []
    try:
        # Get the current directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Create temporary files
        temp_upload = os.path.join(current_dir, f"temp_upload_{uuid.uuid4().hex}{os.path.splitext(file.filename)[1]}")
        temp_wav = os.path.join(current_dir, f"temp_{uuid.uuid4().hex}_output.wav")
        temp_files.extend([temp_upload, temp_wav])
        
        # Save uploaded file
        logger.info(f"Saving uploaded file to: {temp_upload}")
        with open(temp_upload, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Convert to 16kHz WAV
        logger.info("Converting audio to 16kHz WAV...")
        if not convert_to_16khz_wav(temp_upload, temp_wav):
            raise HTTPException(status_code=500, detail="Failed to convert audio to correct format")
        
        # Verify the converted file exists and has content
        if not os.path.exists(temp_wav) or os.path.getsize(temp_wav) == 0:
            raise HTTPException(status_code=500, detail="Audio conversion produced no output")
        
        logger.info(f"Converted file size: {os.path.getsize(temp_wav)} bytes")
        
        # Transcription de l'audio (exécutée dans un thread pour éviter le blocage)
        logger.info("Starting transcription...")
        raw_transcript = await asyncio.to_thread(transcribe_audio, temp_wav)
        logger.info(f"Transcription completed. Raw output: {raw_transcript[:200]}...")
        
        # Clean the transcript
        cleaned_transcript = clean_transcript(raw_transcript)
        if not cleaned_transcript:
            logger.error("No usable content in transcription")
            raise HTTPException(status_code=500, detail="Transcription produced no usable content")
            
        logger.info(f"Cleaned transcript: {cleaned_transcript[:200]}...")

        # Initialize summary variables
        petit_resume = ""
        gros_resume = ""
        
        # Only generate summaries if enabled and API key provided
        if enable_summary and api_key:
            # Set the API key for the summarizer
            os.environ["OPENAI_API_KEY"] = api_key
            
            # Exécuter les appels de résumé en parallèle
            logger.info("Generating summaries...")
            bullet_future = asyncio.to_thread(generate_bullet_summary, cleaned_transcript, api_key)
            detailed_future = asyncio.to_thread(generate_detailed_summary, cleaned_transcript, api_key)
            petit_resume, gros_resume = await asyncio.gather(bullet_future, detailed_future)
            logger.info("Summaries generated")
            
            # Clear the API key from environment
            os.environ.pop("OPENAI_API_KEY", None)

        # Création du contenu Markdown
        markdown_content = (
            f"# StudyFlow Transcript Summary\n\n"
            f"**Date** : {datetime.date.today().isoformat()}\n\n"
            f"## Transcription originale\n\n"
            f"```\n{cleaned_transcript}\n```\n\n"
        )
        
        if enable_summary and api_key:
            markdown_content += (
                f"## Petit résumé (points clés)\n\n"
                f"{petit_resume}\n\n"
                f"## Gros résumé détaillé\n\n"
                f"{gros_resume}\n"
            )

        # Construction de l'objet final JSON
        final_result = {
            "date": datetime.date.today().isoformat(),
            "title": "StudyFlow Transcript Summary",
            "original_transcript": cleaned_transcript,
            "petit_resume": petit_resume,
            "gros_resume": gros_resume,
            "markdown": markdown_content
        }

        # Save results
        results_folder = os.path.join(current_dir, "results")
        os.makedirs(results_folder, exist_ok=True)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save JSON
        output_path_json = os.path.join(results_folder, f"result_{timestamp}.json")
        with open(output_path_json, "w", encoding="utf-8") as f:
            json.dump(final_result, f, ensure_ascii=False, indent=4)
        logger.info(f"JSON saved to: {output_path_json}")
        
        # Save Markdown
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
                    logger.error(f"Failed to remove temporary file {temp_file}: {str(e)}")
