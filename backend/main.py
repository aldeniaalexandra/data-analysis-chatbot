import os
from dotenv import load_dotenv
from groq import Groq
import pandas as pd

# Load environment variables from .env
load_dotenv()

# Create Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_data_summary(dataset):
    summary = (
        f"--- Dataset Summary ---\n"
        f"Rows: {dataset.shape[0]}, Columns: {dataset.shape[1]}\n\n"
        f"Column Names and Data Types:\n{dataset.dtypes.to_string()}\n\n"
        f"Missing Values:\n{dataset.isnull().sum().to_string()}\n\n"
        f"Summary Statistics:\n{dataset.describe(include='all').to_string()}\n"
        f"-----------------------"
    )
    return summary


# Load and explore dataset
print("Loading dataset...")
df = pd.read_csv("data/data.csv")

# Generate and print the data summary
data_summary = get_data_summary(df)
print(data_summary)
print()

# Conversation history — a list of messages
# The system message always goes first to set the AI's persona and behavior.
# Now we inject the data_summary directly into the AI's prompt!
conversation_history = [
    {
        "role": "system", 
        "content": (
            f"You are a helpful data analysis assistant. Here is the dataset you will be analyzing:\n{data_summary}\n\n"
            "When asked a question about the data, you must respond ONLY with Python code using pandas that answers the question. "
            "The code must store the final answer in a variable called `result`. "
            "Assume the dataset is already loaded into a pandas DataFrame called `df`. "
            "Do not include any explanations, markdown code blocks, or text. Only return the raw python code."
        )
    },
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


# Conversation loop
print("Chatbot ready. Type 'exit' to quit.\n")

while True:
    user_input = input("You: ")

    if user_input.strip().lower() == "exit":
        print("Goodbye!")
        break

    reply = chat(user_input)
    print(f"Assistant: {reply}\n")
