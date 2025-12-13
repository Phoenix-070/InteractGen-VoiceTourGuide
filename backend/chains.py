from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from schemas import TourPlan, ChatResponse

# 1. Chain to Generate the Tour Script
def get_tour_generator_chain():
    # Using gemini-pro as it is available
    llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.7)
    
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
    1. Analyze the 'Visible Elements' to understand the page content flow.
    2. Create a tour script that feels like a human guide reading the most interesting parts to the user.
    3. **CRITICAL**: Do NOT just list headers. If you see a paragraph (P) with content, include it in the narrative so the user learns something.
    4. **Scrolling**: The tour must scroll down the page. Select elements occurring later in the list to trigger scrolling.
    5. **Narrative**: The narrative should be conversational, informative, and connect steps logically. (e.g. "Now, moving down to the history section...", "Here we can see...").
    6. Ensure the CSS selectors are accurate based on the provided JSON. Use the exact selectors provided.
    
    {format_instructions}
    """
    
    prompt = ChatPromptTemplate.from_template(template, partial_variables={"format_instructions": parser.get_format_instructions()})
    
    chain = prompt | llm | parser
    return chain

# 2. Chain to Answer Questions (Chat)
def get_chat_chain():
    llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.5)
    
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
