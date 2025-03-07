import os
import re
import json
import uuid
import shutil
import datetime
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Importations relatives, puisque ce fichier est exécuté depuis le dossier backend.
from audio_processor import transcribe_audio
from summarizer import generate_bullet_summary, generate_detailed_summary

app = FastAPI()

# Configuration CORS pour autoriser le front-end sur http://localhost:3000
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_transcript(transcript: str) -> str:
    """
    Supprime les repères temporels au format [HH:MM:SS.mmm --> HH:MM:SS.mmm] du transcript.
    """
    return re.sub(r'\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]\s*', '', transcript)

@app.post("/transcribe/")
async def transcribe(file: UploadFile = File(...)):
    """
    Endpoint pour transcrire un fichier audio, générer en parallèle un petit résumé (points clés)
    et un gros résumé détaillé, exporter le tout dans des fichiers JSON et Markdown,
    puis supprimer le fichier audio temporaire.
    """
    try:
        # Sauvegarde du fichier temporaire
        temp_filename = f"temp_{uuid.uuid4().hex}_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Transcription de l'audio (exécutée dans un thread pour éviter le blocage)
        raw_transcript = await asyncio.to_thread(transcribe_audio, temp_filename)

        # Nettoyage du transcript (suppression des timestamps)
        cleaned_transcript = clean_transcript(raw_transcript)

        # Exécuter les appels de résumé en parallèle
        bullet_future = asyncio.to_thread(generate_bullet_summary, cleaned_transcript)
        detailed_future = asyncio.to_thread(generate_detailed_summary, cleaned_transcript)
        petit_resume, gros_resume = await asyncio.gather(bullet_future, detailed_future)

        # Création du contenu Markdown
        markdown_content = (
            f"# StudyFlow Transcript Summary\n\n"
            f"**Date** : {datetime.date.today().isoformat()}\n\n"
            f"## Transcription originale\n\n"
            f"```\n{cleaned_transcript}\n```\n\n"
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

        # Création du dossier results (si inexistant)
        results_folder = os.path.join(os.path.dirname(__file__), "results")
        os.makedirs(results_folder, exist_ok=True)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

        # Export JSON
        output_filename_json = f"result_{timestamp}.json"
        output_path_json = os.path.join(results_folder, output_filename_json)
        with open(output_path_json, "w", encoding="utf-8") as f_json:
            json.dump(final_result, f_json, ensure_ascii=False, indent=4)

        # Export Markdown
        output_filename_md = f"result_{timestamp}.md"
        output_path_md = os.path.join(results_folder, output_filename_md)
        with open(output_path_md, "w", encoding="utf-8") as f_md:
            f_md.write(markdown_content)

        # Suppression du fichier temporaire
        os.remove(temp_filename)

        return final_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
