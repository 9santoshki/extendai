import requests
import json

# Test the API endpoint exactly as the extension would call it
def test_extension_api():
    url = "http://localhost:8000/api/task"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": "chrome-extension://test-extension",  # Simulate extension origin
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    payload = {
        "task": "What is this page about?",
        "page_data": {
            "url": "https://www.example.com",
            "title": "Example Domain",
            "text": "This domain is for use in illustrative examples in documents.",
            "interactiveElements": [],
            "forms": [],
            "links": []
        },
        "chat_history": [],
        "session_id": "test-session-1",
        "config": {
            "api_key": "ollama",
            "model": "qwen2.5",
            "base_url": "http://localhost:11434/v1",
            "personality": "a helpful and friendly AI browsing assistant"
        }
    }
    
    try:
        print("Sending test request to the backend...")
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text[:500]}...")  # First 500 chars
        if len(response.text) > 500:
            print("... (response truncated)")
    except requests.exceptions.Timeout:
        print("Request timed out after 60 seconds")
    except requests.exceptions.ConnectionError:
        print("Could not connect to the backend service")
    except requests.exceptions.RequestException as e:
        print(f"Request failed with error: {e}")

if __name__ == "__main__":
    test_extension_api()