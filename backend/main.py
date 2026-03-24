import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env
load_dotenv()

# Create Groq client using API key from .env
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Send a hardcoded message to the model
chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Say hello!",
        }
    ],
    model="llama-3.3-70b-versatile",
)

# Print the response
print(chat_completion.choices[0].message.content)
