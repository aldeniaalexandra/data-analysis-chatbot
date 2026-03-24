import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env
load_dotenv()

# Create Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Conversation history — a list of messages
# Each message is a dict with "role" and "content"
# The system message always goes first — it sets the AI's persona and behavior
conversation_history = [
    {"role": "system", "content": "You are a helpful data analysis assistant."},
    {"role": "user", "content": "Say hello!"},
]

# Send the conversation history to the model
response = client.chat.completions.create(
    messages=conversation_history,
    model="llama-3.3-70b-versatile",
)

# Get the assistant's reply
assistant_reply = response.choices[0].message.content

# Append the assistant's reply to the history
conversation_history.append({"role": "assistant", "content": assistant_reply})

# Print the full conversation so far
for message in conversation_history:
    print(f"[{message['role'].upper()}]: {message['content']}")
