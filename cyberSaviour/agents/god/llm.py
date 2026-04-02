from dotenv import load_dotenv
from google import genai 
import os 
load_dotenv()
google_api_key=os.getenv('API')
def deployLLM(model,contents):
    client=genai.Client(api_key=google_api_key)
    response=client.models.generate_content(
            model=model,contents=contents)
    return response.text
    
