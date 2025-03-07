import subprocess
import os

def transcribe_audio(file_path: str) -> str:
    """
    Transcribes an audio file using the Whisper.cpp binary.
    
    Parameters:
        file_path (str): Path to the audio file.
    
    Returns:
        str: The transcription text.
    """
    # Define the absolute path to the Whisper.cpp binary.
    # Assuming the binary is in backend/whisper.cpp/build/bin/whisper-cli.
    binary_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "whisper.cpp", "build", "bin", "whisper-cli"))
    
    # Define the absolute path to the model file.
    # Since your model is located in backend/models/large-v3-turbo.bin,
    # use os.path.join with the current directory (backend) and 'models'.
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "models", "large-v3-turbo.bin"))
    
    # Command to run Whisper with the specified model and language (French in this case)
    command = [binary_path, "-m", model_path, "-l", "fr", "-f", file_path]
    
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
        error_message = f"Transcription failed: {e.stderr}"
        raise Exception(error_message)
