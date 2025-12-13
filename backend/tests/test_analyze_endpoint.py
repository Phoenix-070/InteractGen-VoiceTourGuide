from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys
import os

# Add backend to path so we can import from main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "Voice Tour API is running" in response.json()["message"]

@patch("main.get_tour_generator_chain")
def test_analyze_page(mock_get_chain):
    # Mock chain response
    mock_chain_instance = MagicMock()
    # The chain invokes and returns a Pydantic model (TourPlan) usually, 
    # but based on main.py logic it returns `result`.
    # chains.py: chain = prompt | llm | parser. Parser returns a TourPlan object (Pydantic model).
    # main.py: return result. FastAPI automatically serializes Pydantic models to JSON.
    
    # So we should return a mock object that looks like TourPlan or a dict if FastAPI handles it?
    # Since it's a Pydantic object, let's return a dict for simplicity if we were mocking the parser output usage,
    # BUT the parser returns an OBJECT.
    # So we should return an object with a .dict() or just a simple Namespace/Object.
    # However, to be safe, let's restart the mock to return a dict and see if main.py handles it?
    # main.py: `result = chain.invoke(...)`. `return result`.
    # If `result` is a Pydantic object, FastAPI handles it. 
    # If `result` is a dict, FastAPI handles it.
    
    mock_chain_instance.invoke.return_value = {
        "steps": [
            {"element_selector": "h1", "narrative": "This is the title.", "action": "scroll"}
        ]
    }
    mock_get_chain.return_value = mock_chain_instance

    # Ensure API key is present for the test
    with patch.dict(os.environ, {"GOOGLE_API_KEY": "test_key"}):
        payload = {
            "url": "https://example.com",
            "title": "Example Domain",
            "elements": [
                {"tagName": "h1", "text": "Example Domain", "id": "", "className": ""}
            ]
        }
        response = client.post("/api/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "steps" in data
        assert data["steps"][0]["narrative"] == "This is the title."
