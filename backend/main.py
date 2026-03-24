import pandas as pd
from dotenv import load_dotenv
from src.chatbot import ChatBot

def main():
    # 1. Load environment variables
    load_dotenv()
    
    # 2. Initialize the AI Chatbot object
    bot = ChatBot()
    
    # 3. Load the dataset (simulating a user upload pipeline)
    print("Loading dataset into ChatBot...")
    df = pd.read_csv("data/data.csv")
    bot.load_data(df)
    
    # 4. Interactive conversation loop
    print("Chatbot ready. Type 'exit' to quit.\n")
    
    while True:
        user_input = input("You: ")
        
        if user_input.strip().lower() == "exit":
            print("Goodbye!")
            break
            
        reply = bot.chat(user_input)
        print(f"Assistant: {reply}\n")

if __name__ == "__main__":
    main()
