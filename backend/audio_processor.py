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
    # Define the absolute path to the Whisper.cpp binary
    binary_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 
                                              "whisper.cpp", "build", "bin", "whisper-cli"))
    
    # Define the absolute path to the model file
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 
                                             "models", "large-v3-turbo.bin"))
    
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
    
    # Command with correct parameters for whisper-cli
    command = [
        binary_path,
        "-m", model_path,
        "-f", abs_file_path,
        "-l", "auto",          # language
        "-otxt",              # output text file
        "-pp",               # print progress
        "--output-json",     # also output JSON for more info
        "--print-colors",    # for better debug output
        "-osrt"              # output SRT format with timestamps
    ]
    
    logger.info(f"Running command: {' '.join(command)}")
    logger.info(f"File size: {os.path.getsize(abs_file_path)} bytes")
    
    try:
        # Run the command and capture output
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        
        # Log the outputs
        if result.stdout:
            logger.info(f"Whisper stdout: {result.stdout[:200]}...")
        if result.stderr:
            logger.warning(f"Whisper stderr: {result.stderr}")
            
        # Try to read from the output text file first
        txt_output = abs_file_path + ".txt"
        if os.path.exists(txt_output):
            with open(txt_output, 'r', encoding='utf-8') as f:
                transcription = f.read().strip()
            os.remove(txt_output)  # Clean up
        else:
            # If no output file, use stdout
            transcription = result.stdout.strip()
            
        if not transcription:
            raise Exception("No transcription output generated")
            
        logger.info(f"Transcription successful, length: {len(transcription)} characters")
        return transcription
        
    except subprocess.CalledProcessError as e:
        error_message = (
            f"Transcription failed:\n"
            f"Command: {' '.join(command)}\n"
            f"Exit code: {e.returncode}\n"
            f"Stdout: {e.stdout}\n"
            f"Stderr: {e.stderr}"
        )
        logger.error(error_message)
        raise Exception(error_message)
    except Exception as e:
        error_message = f"Unexpected error during transcription: {str(e)}"
        logger.error(error_message)
        raise Exception(error_message)
    finally:
        # Clean up any remaining output files
        txt_output = abs_file_path + ".txt"
        if os.path.exists(txt_output):
            try:
                os.remove(txt_output)
            except Exception as e:
                logger.warning(f"Failed to remove output file: {str(e)}")
