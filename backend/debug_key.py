import os
import google.generativeai as genai
from dotenv import load_dotenv

def debug_api_key():
    load_dotenv()
    
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_API_KEY not found in environment variables.")
        return

    print(f"API Key found (length {len(api_key)}): {api_key[:4]}...{api_key[-4:]}")

    if api_key == "your_google_api_key_here":
        print("ERROR: You are using the placeholder API key. Please set a valid key in .env")
        return

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Say 'OK'")
        print("Success! Model response:", response.text)
    except Exception as e:
        print("Failed to use API key.")
        print("Error:", e)

if __name__ == "__main__":
    debug_api_key()
