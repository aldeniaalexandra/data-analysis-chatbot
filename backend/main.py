import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env
load_dotenv()

# Create Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Conversation history — a list of messages
# The system message always goes first to set the AI's persona and behavior
conversation_history = [
    {"role": "system", "content": "You are a helpful data analysis assistant."},
]


def chat(user_message):
    # 1. Append the user's message to the history
    conversation_history.append({"role": "user", "content": user_message})

    # 2. Send the entire history to the Groq API
    response = client.chat.completions.create(
        messages=conversation_history,
        model="llama-3.3-70b-versatile",
    )

    # 3. Extract the assistant's reply
    assistant_reply = response.choices[0].message.content

    # 4. Append the reply to the history so the model remembers it
    conversation_history.append({"role": "assistant", "content": assistant_reply})

    # 5. Return the reply text
    return assistant_reply


# Quick test — one hardcoded message
reply = chat("Say hello!")
print(reply)
