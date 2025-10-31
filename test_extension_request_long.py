import requests
import json
import time

# Test the API endpoint with extended timeout
def test_extension_api_timeout():
    url = "http://localhost:8000/api/task"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
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
    
    print("Sending test request to the backend with extended timeout...")
    start_time = time.time()
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)  # 2 minute timeout
        end_time = time.time()
        print(f"Response Status Code: {response.status_code}")
        print(f"Response Time: {end_time - start_time:.2f} seconds")
        print(f"Response Body Preview: {response.text[:200]}...")
        if len(response.text) > 200:
            print("... (response truncated)")
    except requests.exceptions.Timeout:
        end_time = time.time()
        print(f"Request timed out after 120 seconds. Duration: {end_time - start_time:.2f} seconds")
    except requests.exceptions.ConnectionError:
        end_time = time.time()
        print(f"Could not connect to the backend service. Duration: {end_time - start_time:.2f} seconds")
    except requests.exceptions.RequestException as e:
        end_time = time.time()
        print(f"Request failed with error after {end_time - start_time:.2f} seconds: {e}")

if __name__ == "__main__":
    test_extension_api_timeout()