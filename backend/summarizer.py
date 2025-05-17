import os
import openai
from langdetect import detect
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize the OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def detect_language(text: str) -> str:
    """
    Détecte la langue du texte (renvoie un code ISO, ex: 'en', 'fr', etc.)
    """
    try:
        return detect(text)
    except:
        return "en"  # fallback

def generate_bullet_summary(transcript: str, api_key: str = None) -> str:
    """
    Génère un petit résumé (en puces) à partir du transcript,
    en respectant la langue détectée du texte.
    """
    openai_api_key = api_key or os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise Exception("Clé API OpenAI non définie dans les variables d'environnement.")
        
    # Update the client's API key
    global client
    client = openai.OpenAI(api_key=openai_api_key)
    
    # Détecter la langue
    lang_code = detect_language(transcript)
    
    prompt = (
        "You are an assistant specialized in transcription and factual summarization.\n"
        "First, detect the language of the provided text. Respond using the same language.\n\n"
        "Task: Extract only the essential information from the text in clear, concise bullet points.\n\n"
        "Important rules:\n"
        "1. Do not invent information that does not appear in the transcript.\n"
        "2. Keep phrasing close to the original text.\n"
        "3. No introduction or conclusion, only bullet points.\n"
        "4. Limit the summary to the essentials – no more than 10 points.\n"
        f"5. The text is in '{lang_code}' – respond in this language.\n\n"
        "Text to summarize:\n"
        f"{transcript}\n\n"
        "Bullet-point summary:"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an assistant specialized in transcription and factual summarization. "
                        "Always respond in the same language as the text provided."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.5
        )
        bullet_summary = response.choices[0].message.content.strip()
        return bullet_summary
    except Exception as e:
        raise Exception(f"Échec du résumé en puces : {str(e)}")

def generate_detailed_summary(transcript: str, api_key: str = None) -> str:
    """
    Génère un gros résumé détaillé (en paragraphes) à partir du transcript,
    en respectant la langue détectée du texte.
    """
    openai_api_key = api_key or os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise Exception("Clé API OpenAI non définie dans les variables d'environnement.")
        
    # Update the client's API key
    global client
    client = openai.OpenAI(api_key=openai_api_key)
    
    # Détecter la langue
    lang_code = detect_language(transcript)

    prompt = (
        "You are an assistant specialized in transcription and factual summarization.\n"
        "First, detect the language of the provided text. Respond using the same language.\n\n"
        "Task: Produce a detailed summary explaining the key facts and main ideas of the text.\n"
        "It should be written in clear, concise paragraphs, with no bullet points, "
        "no introduction, and no conclusion.\n"
        f"The text is in '{lang_code}' – respond in this language.\n\n"
        "Text to summarize:\n"
        f"{transcript}\n\n"
        "Detailed summary:"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an assistant specialized in factual summarization. "
                        "Always respond in the same language as the text provided."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.5
        )
        detailed_summary = response.choices[0].message.content.strip()
        return detailed_summary
    except Exception as e:
        raise Exception(f"Échec du résumé détaillé : {str(e)}")
