import requests
import json

def test_backend_connection():
    """Test the exact same call that the background script would make"""
    
    # The payload that background.js would send to the backend
    test_data = {
        "task": "Test message from extension",
        "page_data": {
            "url": "https://www.example.com",
            "title": "Example Domain",
            "text": "This domain is for use in illustrative examples in documents.",
            "interactiveElements": []
        },
        "config": {
            "api_key": "ollama",
            "model": "qwen2.5:0.5b",
            "base_url": "http://localhost:11434/v1",
            "personality": "a helpful and friendly AI browsing assistant"
        },
        "session_id": "default"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("Testing backend connection...")
        response = requests.post(
            "http://localhost:8000/api/task",
            headers=headers,
            json=test_data,
            timeout=30
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        if len(response.text) > 200:
            print("... (response truncated)")
        
        if response.status_code == 200:
            try:
                json_response = response.json()
                print("✓ JSON response is valid")
                print(f"✓ Has result field: {'result' in json_response}")
                print(f"✓ Result content: {json_response.get('result', 'N/A')[:100]}...")
            except json.JSONDecodeError:
                print("✗ Response is not valid JSON")
        else:
            print("✗ Request failed")
            
    except requests.exceptions.Timeout:
        print("✗ Request timed out")
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to backend")
    except Exception as e:
        print(f"✗ Error occurred: {e}")

if __name__ == "__main__":
    test_backend_connection()