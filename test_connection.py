import requests
import json

# Test the exact connection test format that the extension might be using
def test_connection():
    url = "http://localhost:8000/api/task"
    
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:91.0) Gecko/20100101 Firefox/91.0"
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
        print("Sending connection test request...")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")
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

if __name__ == "__main__":
    test_connection()