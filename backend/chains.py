from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List

# Define the structured output for Tour Steps
class TourStep(BaseModel):
    element_selector: str = Field(description="CSS selector for the element to highlight")
    narrative: str = Field(description="The text to read out loud for this step")
    action: str = Field(description="Action to perform: 'scroll', 'click', or 'none'", default="scroll")

class TourPlan(BaseModel):
    steps: List[TourStep] = Field(description="List of steps for the tour")

# Models representing the input Page
class DOMElement(BaseModel):
    tagName: str
    text: str
    id: str = ""
    className: str = ""
    selector: str = ""

# 1. Chain to Generate the Tour Script
def get_tour_generator_chain():
    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
    
    parser = PydanticOutputParser(pydantic_object=TourPlan)
    
    template = """
    You are an expert interactive tour guide for websites.
    Your goal is to create a voice-guided tour for a webpage based on its simplified DOM structure.
    
    User Intent: {user_intent}
    
    Page Context:
    Title: {page_title}
    
    Visible Elements (Simplified):
    {dom_elements}
    
    Instructions:
    1. Select the most relevant elements that match the user's intent.
    2. Create a linear script. For each step, provide a CSS selector (use IDs or explicit text matching if needed) and a friendly narrative.
    3. Keep the narrative concise (1-2 sentences) and conversational.
    4. Ensure the CSS selectors are accurate based on the provided JSON.
    
    {format_instructions}
    """
    
    prompt = ChatPromptTemplate.from_template(template)
    
    chain = prompt | llm | parser
    return chain

# 2. Chain to Answer Questions (Chat)
def get_chat_chain():
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.5)
    
    template = """
    You are a helpful assistant viewing a webpage.
    
    Page Title: {page_title}
    Content Snippets:
    {page_content}
    
    User Query: {query}
    
    Answer the user's question based *only* on the page content provided. 
    If you need to scroll to a specific section to see more, suggest it.
    """
    
    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | llm
    return chain
