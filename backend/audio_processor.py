import subprocess
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("audio_processor")

def transcribe_audio(file_path: str) -> str:
    """
    Transcribes an audio file using the Whisper.cpp binary.
    
    Parameters:
        file_path (str): Path to the audio file.
    
    Returns:
        str: The transcription text.
    """
    # Define the absolute path to the Whisper.cpp binary.
    binary_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "whisper.cpp", "build", "bin", "whisper-cli"))
    
    # Define the absolute path to the model file.
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "models", "large-v3-turbo.bin"))
    
    # Get absolute path to the audio file
    abs_file_path = os.path.abspath(file_path)
    
    # Check if files exist
    if not os.path.exists(binary_path):
        error = f"Binary not found at: {binary_path}"
        logger.error(error)
        raise FileNotFoundError(error)
        
    if not os.path.exists(model_path):
        error = f"Model not found at: {model_path}"
        logger.error(error)
        raise FileNotFoundError(error)
        
    if not os.path.exists(abs_file_path):
        error = f"Audio file not found at: {abs_file_path}"
        logger.error(error)
        raise FileNotFoundError(error)
    
    # Auto-detect language mode instead of hardcoding to French
    command = [binary_path, "-m", model_path, "-f", abs_file_path]
    
    logger.info(f"Running command: {' '.join(command)}")
    
    try:
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        transcription = result.stdout.strip()
        return transcription
    except subprocess.CalledProcessError as e:
        error_message = f"Transcription failed: Command: {' '.join(command)}\nExit code: {e.returncode}\nStdout: {e.stdout}\nStderr: {e.stderr}"
        logger.error(error_message)
        raise Exception(error_message)
