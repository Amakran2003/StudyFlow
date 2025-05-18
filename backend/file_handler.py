import os
import re
import json
import uuid
import shutil
import datetime
import logging
from pathlib import Path
from typing import Dict, List

logger = logging.getLogger("file_handler")

class FileHandler:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.temp_files: List[str] = []
        self.results_folder = os.path.join(base_dir, "results")
        os.makedirs(self.results_folder, exist_ok=True)

    def save_temp_audio(self, file_content) -> str:
        """Save uploaded file temporarily and return its path"""
        audio_path = os.path.join(self.base_dir, f"temp_{uuid.uuid4()}.wav")
        self.temp_files.append(audio_path)
        
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(file_content, buffer)
        
        return audio_path

    def save_results(self, transcript: str, summaries: Dict = None) -> Dict[str, str]:
        """Save transcription and summaries to files"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        final_result = {
            "transcription": transcript
        }

        if summaries:
            final_result.update(summaries)

        # Create markdown content
        markdown_content = f"""# Transcription {timestamp}
### Transcription:
{transcript}
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

        # Save JSON result
        json_path = os.path.join(self.results_folder, f"result_{timestamp}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(final_result, f, ensure_ascii=False, indent=4)
        logger.info(f"JSON saved to: {json_path}")
        
        # Save Markdown result
        md_path = os.path.join(self.results_folder, f"result_{timestamp}.md")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(markdown_content)
        logger.info(f"Markdown saved to: {md_path}")

        return final_result

    def cleanup(self) -> None:
        """Clean up temporary files"""
        for temp_file in self.temp_files:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                    logger.info(f"Temporary file removed: {temp_file}")
                except Exception as e:
                    logger.warning(f"Failed to remove temporary file {temp_file}: {str(e)}")
        
        self.temp_files.clear()

    @staticmethod
    def clean_transcript(transcript: str) -> str:
        """Clean up the transcript by removing timestamps and other markers"""
        if not transcript:
            return ""
            
        lines = transcript.split('\n')
        cleaned_lines = []
        
        for line in lines:
            if not line.strip() or re.match(r'^\[\d{2}:\d{2}:\d{2}\.\d{3} -->', line):
                continue
                
            line = re.sub(r'\[\d{2}:\d{2}:\d{2}\.\d{3} -->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]\s*', '', line)
            line = re.sub(r'\*.*?\*', '', line)
            
            if line.strip():
                cleaned_lines.append(line.strip())
        
        return '\n'.join(cleaned_lines)
