# main.py (patch - top of file)
from dotenv import load_dotenv
load_dotenv()  # <-- must run before importing modules that may rely on env vars

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import traceback
from chains import get_tour_generator_chain, get_chat_chain
from schemas import PageContent, ChatRequest

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local extension dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    api_key = os.environ.get("GOOGLE_API_KEY", "")
    has_valid_key = api_key and api_key != "your_google_api_key_here"
    return {"message": "Voice Tour API is running", "has_google_key": has_valid_key}

@app.post("/api/analyze")
def analyze_page(content: PageContent):
    api_key = os.environ.get("GOOGLE_API_KEY", "")
    use_mock = os.environ.get("USE_MOCK_AI", "false").lower() == "true"
    
    if use_mock or not api_key or api_key == "your_google_api_key_here":
          print("Using MOCK AI response")
          return {
              "steps": [
                  {
                      "element_selector": "h1, h2, #title", 
                      "narrative": f"Welcome to {content.title}. This is a simulated tour step 1.", 
                      "action": "scroll"
                  },
                  {
                      "element_selector": "p, article", 
                      "narrative": "Here is some main content. This is step 2 of the mock tour.", 
                      "action": "highlight"
                  },
                  {
                      "element_selector": "button, a", 
                      "narrative": "Finally, here are some interactive elements. End of mock tour.", 
                      "action": "click"
                  }
              ]
          }
    
    try:
        chain = get_tour_generator_chain()
        # Convert simplified elements to text block or pass as list
        dom_text = "\n".join([f"<{el.tagName} id='{el.id}'>{el.text}</{el.tagName}>" for el in content.to_dom_elements()])
        
        result = chain.invoke({
            "user_intent": "Give me a general tour",
            "page_title": content.title,
            "dom_elements": dom_text
        })
        return result
    except Exception as e:
        traceback.print_exc()
        error_msg = str(e)
        if "insufficient_quota" in error_msg or "429" in error_msg:
             return {"steps": [{"element_selector": "body", "narrative": "⚠️ API Quota Exceeded. Try again later or use Mock Mode.", "action": "none"}]}
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat_with_page(request: ChatRequest):
    api_key = os.environ.get("GOOGLE_API_KEY", "")
    use_mock = os.environ.get("USE_MOCK_AI", "false").lower() == "true"

    if use_mock or not api_key or api_key == "your_google_api_key_here":
        return {
            "response": "I am in Mock Mode. I cannot read the page, but I can simulate a response. Did you ask about the title?", 
            "suggestions": ["What is this page?", "Summarize content", "Mock Option 3"]
        }
    
    try:
        chain = get_chat_chain()
        dom_text = "\n".join([f"<{el['tagName']}>{el['text']}</{el['tagName']}>" for el in request.content.elements])
        
        result = chain.invoke({
            "page_title": request.content.title,
            "page_content": dom_text,
            "query": request.query
        })
        return {"response": result.answer, "suggestions": result.suggestions}
    except Exception as e:
        traceback.print_exc()
        error_msg = str(e)
        if "insufficient_quota" in error_msg:
            return {"response": "⚠️ API Quota Exceeded."}
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import sys
    import asyncio

    if sys.platform == "win32":
        # Workaround for "WinError 10054" noise in asyncio ProactorEventLoop on Windows
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    uvicorn.run(app, host="0.0.0.0", port=8000)
