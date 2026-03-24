import os
import pandas as pd
from groq import Groq
from src.code_executor import clean_code, execute_code

class ChatBot:
    def __init__(self):
        # Initialize Groq client
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        # Session state
        self.df = None
        self.conversation_history = []
        
        # Model configuration
        self.model = "llama-3.3-70b-versatile"

    def _get_data_summary(self):
        """Helper to generate summary of the loaded dataset."""
        if self.df is None:
            return "No dataset loaded."
            
        summary = (
            f"--- Dataset Summary ---\n"
            f"Rows: {self.df.shape[0]}, Columns: {self.df.shape[1]}\n\n"
            f"Column Names and Data Types:\n{self.df.dtypes.to_string()}\n\n"
            f"Missing Values:\n{self.df.isnull().sum().to_string()}\n\n"
            f"Summary Statistics:\n{self.df.describe(include='all').to_string()}\n"
            f"-----------------------"
        )
        return summary

    def load_data(self, df):
        """Loads a new dataframe and resets conversation history."""
        self.df = df
        data_summary = self._get_data_summary()
        
        # Reset the history with a fresh system prompt
        self.conversation_history = [
            {
                "role": "system", 
                "content": (
                    f"You are a helpful data analysis assistant. Here is the dataset you will be analyzing:\n{data_summary}\n\n"
                    "When asked a question about the data, you must respond ONLY with Python code using pandas that answers the question. "
                    "The code must store the final answer in a variable called `result`. "
                    "Assume the dataset is already loaded into a pandas DataFrame called `df`. "
                    "Do not include any explanations, markdown code blocks, or text. Only return the raw python code."
                )
            }
        ]

    def chat(self, user_message):
        """Sends a message to the AI, handles execution and self-healing, and returns the result."""
        if self.df is None:
            return "Please load a dataset first."
            
        # 1. Append the user's message to the history
        self.conversation_history.append({"role": "user", "content": user_message})

        max_retries = 3
        for attempt in range(max_retries):
            # 2. Send the history to the Groq API
            response = self.client.chat.completions.create(
                messages=self.conversation_history,
                model=self.model,
            )

            # 3. Extract the assistant's reply (the raw Python code)
            assistant_reply = response.choices[0].message.content

            # 4. Append the raw code to the history so the model remembers it
            self.conversation_history.append({"role": "assistant", "content": assistant_reply})

            # 5. Clean the code and execute it
            cleaned = clean_code(assistant_reply)
            execution_result = execute_code(cleaned, self.df)
            
            # 6. Check for execution errors
            if isinstance(execution_result, str) and (execution_result.startswith("Error:") or execution_result.startswith("Execution Error:")):
                if attempt < max_retries - 1:
                    print(f"[Self-Healing] Execution failed on attempt {attempt + 1}. Asking AI to fix...")
                    error_prompt = f"The code failed with this error:\n{execution_result}\n\nPlease fix the code and write it again. Ensure the output is ONLY valid Python code."
                    self.conversation_history.append({"role": "user", "content": error_prompt})
                    continue
                else:
                    return f"I'm sorry, I couldn't write the correct code after {max_retries} attempts. Final error: {execution_result}"

            # 7. If no error, return the successful result!
            return execution_result
