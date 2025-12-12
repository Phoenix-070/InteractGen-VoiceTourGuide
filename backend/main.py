from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import os
from dotenv import load_dotenv
from chains import get_tour_generator_chain, get_chat_chain, DOMElement

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local extension dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PageContent(BaseModel):
    url: str
    title: str
    elements: List[Dict[str, Any]]

    def to_dom_elements(self) -> List[DOMElement]:
        return [DOMElement(**el) for el in self.elements]

class ChatRequest(BaseModel):
    query: str
    content: PageContent

@app.get("/")
def read_root():
    return {"message": "Voice Tour API is running", "has_google_key": "GOOGLE_API_KEY" in os.environ}

@app.post("/api/analyze")
def analyze_page(content: PageContent):
    if "GOOGLE_API_KEY" not in os.environ:
         # Fallback for demo/testing without key
         return {
             "tour_script": [
                 {"element_selector": "h1", "narrative": f"Welcome to {content.title}. Please set GOOGLE_API_KEY to get a real AI tour.", "action": "scroll"}
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
        error_msg = str(e)
        if "insufficient_quota" in error_msg:
            return {"response": "⚠️ OpenAI API Quota Exceeded. Please check your billing settings."}
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat_with_page(request: ChatRequest):
    if "GOOGLE_API_KEY" not in os.environ:
        return {"response": "I need a Google API Key to answer questions."}
    
    try:
        chain = get_chat_chain()
        dom_text = "\n".join([f"<{el['tagName']}>{el['text']}</{el['tagName']}>" for el in request.content.elements])
        
        response = chain.invoke({
            "page_title": request.content.title,
            "page_content": dom_text,
            "query": request.query
        })
        return {"response": response.content}
    except Exception as e:
        error_msg = str(e)
        if "insufficient_quota" in error_msg:
            return {"response": "⚠️ OpenAI API Quota Exceeded. Please check your billing settings."}
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
