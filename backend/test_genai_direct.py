# test_genai_direct.py
import os
from google import genai
from dotenv import load_dotenv
load_dotenv()


API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise SystemExit("Set GEMINI_API_KEY or GOOGLE_API_KEY in the environment.")

# Create client. For plain API-key usage (Gemini Developer API) just pass api_key.
# If you're on Vertex AI, see notes in comments below.
client = genai.Client(api_key=API_KEY, vertexai=False)  # vertexai=True if using Vertex configuration

# Choose a model that supports generation (from your printed list):
model = "models/gemini-2.5-flash"   # <- use one of the generation-capable models you listed

print("Calling model:", model)

resp = client.models.generate_content(
    model=model,
    contents="Hello — please reply with just the word 'ok' so I can confirm generation works."
)

# New SDK returns a small object; extract text safely:
try:
    # many examples show resp.text
    text = resp.text
except Exception:
    # fallback: inspect full object
    text = str(resp)

print("Model responded:")
print(text)
