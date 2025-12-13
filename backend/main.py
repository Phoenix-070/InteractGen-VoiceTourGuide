# =========================
# main.py
# =========================

from dotenv import load_dotenv
load_dotenv()  # MUST be first

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import traceback
import sys
import asyncio

from chains import get_tour_generator_chain, get_chat_chain
from schemas import PageContent, ChatRequest

# -------------------------
# Windows asyncio fix
# -------------------------
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# -------------------------
# App setup
# -------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK for local extension dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Strong API key guard
# -------------------------
def is_valid_google_api_key() -> bool:
    """
    Prevents accidental Gemini calls with invalid keys.
    Does NOT guarantee quota, only validity of format.
    """
    api_key = os.environ.get("GOOGLE_API_KEY", "").strip()

    # Explicit mock override (optional)
    if os.environ.get("USE_MOCK_AI", "").lower() == "true":
        return False

    if not api_key:
        return False

    # Google API keys typically:
    # - start with 'AIza'
    # - ~39 characters long
    if not api_key.startswith("AIza"):
        return False

    if len(api_key) < 35:
        return False

    return True

# -------------------------
# Root health check
# -------------------------
@app.get("/")
def read_root():
    return {
        "status": "running",
        "has_valid_google_key": is_valid_google_api_key(),
        "mock_mode": os.environ.get("USE_MOCK_AI", "false").lower() == "true"
    }

# -------------------------
# Analyze page (tour)
# -------------------------
@app.post("/api/analyze")
def analyze_page(content: PageContent):
    if not is_valid_google_api_key():
        print("⚠️ Using MOCK tour (invalid or missing API key)")
        return {
            "steps": [
                {
                    "element_selector": "h1, h2",
                    "narrative": f"Welcome to {content.title}. This is a mock tour step.",
                    "action": "scroll"
                },
                {
                    "element_selector": "p, article",
                    "narrative": "This page contains the main content.",
                    "action": "highlight"
                },
                {
                    "element_selector": "button, a",
                    "narrative": "These are interactive elements on the page.",
                    "action": "click"
                }
            ]
        }

    try:
        chain = get_tour_generator_chain()

        dom_text = "\n".join(
            f"<{el.tagName} id='{el.id}'>{el.text}</{el.tagName}>"
            for el in content.to_dom_elements()
        )

        result = chain.invoke({
            "user_intent": "Give me a general tour",
            "page_title": content.title,
            "dom_elements": dom_text
        })

        return result

    except Exception as e:
        traceback.print_exc()
        msg = str(e).lower()

        if "quota" in msg or "429" in msg:
            return {
                "steps": [{
                    "element_selector": "body",
                    "narrative": "⚠️ AI quota exceeded. Please try again later.",
                    "action": "none"
                }]
            }

        if "api key not valid" in msg:
            return {
                "steps": [{
                    "element_selector": "body",
                    "narrative": "❌ Invalid Google API key.",
                    "action": "none"
                }]
            }

        raise HTTPException(status_code=500, detail=str(e))

# -------------------------
# Chat with page
# -------------------------
@app.post("/api/chat")
def chat_with_page(request: ChatRequest):
    if not is_valid_google_api_key():
        return {
            "response": "⚠️ AI is running in mock mode because no valid Google API key is configured.",
            "suggestions": [
                "What is this page?",
                "Summarize the content",
                "Enable AI mode"
            ]
        }

    try:
        chain = get_chat_chain()

        dom_text = "\n".join(
            f"<{el['tagName']}>{el['text']}</{el['tagName']}>"
            for el in request.content.elements
        )

        result = chain.invoke({
            "page_title": request.content.title,
            "page_content": dom_text,
            "query": request.query
        })

        return {
            "response": result.answer,
            "suggestions": result.suggestions
        }

    except Exception as e:
        traceback.print_exc()
        msg = str(e).lower()

        if "quota" in msg or "429" in msg:
            return {"response": "⚠️ AI quota exceeded. Please try again later."}

        if "api key not valid" in msg:
            return {"response": "❌ Invalid Google API key."}

        raise HTTPException(status_code=500, detail=str(e))

# -------------------------
# Gemini test endpoint
# -------------------------
@app.get("/api/test-gemini")
def test_gemini():
    if not is_valid_google_api_key():
        return {
            "ok": False,
            "reason": "Invalid or missing API key"
        }

    try:
        chain = get_chat_chain()
        result = chain.invoke({
            "page_title": "Test",
            "page_content": "This is a test.",
            "query": "Say OK"
        })

        return {
            "ok": True,
            "response": result.content
        }

    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }

# -------------------------
# Run server
# -------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
