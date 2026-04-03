from dotenv import load_dotenv
from google import genai
import os
import time
import re

load_dotenv()
google_api_key = os.getenv('API')

def deployLLM(model, contents, max_retries=4):
    """Call Gemini LLM with exponential backoff on 429 rate-limit errors."""
    client = genai.Client(api_key=google_api_key)
    delay = 15  # start with 15 s — matches free-tier retry hint

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(model=model, contents=contents)
            return response.text
        except Exception as e:
            err = str(e)
            # Parse the suggested retry delay from the error message if present
            match = re.search(r'retryDelay.*?(\d+)s', err)
            suggested = int(match.group(1)) + 2 if match else delay

            if '429' in err or 'RESOURCE_EXHAUSTED' in err:
                if attempt < max_retries - 1:
                    wait = max(suggested, delay)
                    print(f"  [LLM] Rate-limited. Retrying in {wait}s "
                          f"(attempt {attempt + 1}/{max_retries})...")
                    time.sleep(wait)
                    delay = min(delay * 2, 120)  # cap backoff at 2 min
                else:
                    raise RuntimeError(f"LLM quota exhausted after {max_retries} attempts: {e}")
            else:
                raise  # non-rate-limit errors bubble up immediately
    
