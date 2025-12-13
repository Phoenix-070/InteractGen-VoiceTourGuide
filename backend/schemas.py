from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- Shared Models ---

class DOMElement(BaseModel):
    tagName: str
    text: str
    id: str = ""
    className: str = ""
    selector: str = ""

# --- Request/Response Models ---

class PageContent(BaseModel):
    url: str
    title: str
    elements: List[Dict[str, Any]]

    def to_dom_elements(self) -> List[DOMElement]:
        return [DOMElement(**el) for el in self.elements]

class ChatRequest(BaseModel):
    query: str
    content: PageContent

# --- LLM Structured Output Models ---

class TourStep(BaseModel):
    element_selector: str = Field(description="CSS selector for the element to highlight")
    narrative: str = Field(description="The text to read out loud for this step")
    action: str = Field(description="Action to perform: 'scroll', 'click', 'navigate', or 'none'", default="scroll")
    url: Optional[str] = Field(description="Target URL for 'navigate' action", default=None)

class TourPlan(BaseModel):
    steps: List[TourStep] = Field(description="List of steps for the tour")

class ChatResponse(BaseModel):
    answer: str = Field(description="The answer to the user's question based on the page content")
    suggestions: List[str] = Field(description="List of 3 short follow-up questions the user might ask next")
