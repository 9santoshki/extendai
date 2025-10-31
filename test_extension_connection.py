import requests
import json

# Test the exact connection test format with Chrome extension headers
def test_extension_connection():
    url = "http://localhost:8000/api/task"
    
    # Headers that might be sent by Chrome extension
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Origin": "chrome-extension://test-extension-id",  # Simulating a Chrome extension origin
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-Dest": "empty"
    }
    
    # Try the exact test that might be failing
    payload = {
        "task": "Just say 'Connection successful' - this is a test to verify API connectivity",
        "page_data": {
            "url": "https://www.example.com",
            "title": "Example Domain",
            "text": "This domain is for use in illustrative examples in documents.",
            "interactiveElements": [],
            "forms": [],
            "links": []
        },
        "chat_history": [],
        "session_id": "connection-test",
        "config": {
            "api_key": "ollama",
            "model": "qwen2.5:0.5b",
            "base_url": "http://localhost:11434/v1",
            "personality": "a helpful and friendly AI browsing assistant"
        }
    }
    
    try:
        print("Sending extension-style connection test request...")
        print(f"Headers: {json.dumps(headers, indent=2)}")
        print(f"Payload: {json.dumps(payload, indent=2)[:200]}...")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text[:200]}...")
        if len(response.text) > 200:
            print("... (response truncated)")
        if response.status_code != 200:
            print("ERROR: Connection test failed!")
        else:
            print("SUCCESS: Connection test passed!")
    except requests.exceptions.Timeout:
        print("Request timed out after 30 seconds")
    except requests.exceptions.ConnectionError:
        print("Could not connect to the backend service")
    except requests.exceptions.RequestException as e:
        print(f"Request failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_extension_connection()