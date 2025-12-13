from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from schemas import TourPlan, ChatResponse

# 1. Chain to Generate the Tour Script
def get_tour_generator_chain():
    # Using gemini-pro as it is available
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.7)
    
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
    5. If the user wants to go to a completely different page/website, use action="navigate" and set the "url" field to the full URL (e.g. https://www.google.com).
    
    {format_instructions}
    """
    
    prompt = ChatPromptTemplate.from_template(template, partial_variables={"format_instructions": parser.get_format_instructions()})
    
    chain = prompt | llm | parser
    return chain

# 2. Chain to Answer Questions (Chat)
def get_chat_chain():
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.5)
    
    parser = PydanticOutputParser(pydantic_object=ChatResponse)
    
    template = """
    You are a helpful assistant viewing a webpage.
    
    Page Title: {page_title}
    Content Snippets:
    {page_content}
    
    User Query: {query}
    
    Answer the user's question based *only* on the page content provided. 
    If you need to scroll to a specific section to see more, suggest it.
    
    Also provide 3 relevant follow-up questions the user might want to ask next.
    
    {format_instructions}
    """
    
    prompt = ChatPromptTemplate.from_template(template, partial_variables={"format_instructions": parser.get_format_instructions()})
    chain = prompt | llm | parser
    return chain
