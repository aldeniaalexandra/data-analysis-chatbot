import os
import pandas as pd
from groq import Groq
from src.code_executor import CodeExecutor
from src.data_analyzer import DataAnalyzer

class ChatBot:
    def __init__(self):
        # Initialize Groq client
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        # Session state
        self.df = None
        self.conversation_history = []
        
        # Modules
        self.data_analyzer = DataAnalyzer()
        self.code_executor = CodeExecutor()
        
        # Model configuration
        self.model = "llama-3.3-70b-versatile"
    def load_data(self, df):
        """Loads a new dataframe and resets conversation history."""
        self.df = df
        data_summary = self.data_analyzer.get_summary(self.df)
        
        # Reset the history with a fresh system prompt
        self.conversation_history = [
            {
                "role": "system", 
                "content": (
                    f"You are a helpful data analysis assistant. Here is the dataset you will be analyzing:\n{data_summary}\n\n"
                    "When asked a question about the data, you must respond ONLY with a JSON object. "
                    "The JSON must exactly match this structure:\n"
                    "{\n"
                    '  "code": "the pandas code here",\n'
                    '  "result": "a nicely formatted human-readable answer",\n'
                    '  "chart": {\n'
                    '    "type": "bar" or "pie" or "line" or null,\n'
                    '    "title": "chart title",\n'
                    '    "labels": ["label1", "label2"],\n'
                    '    "values": [10, 20]\n'
                    "  }\n"
                    "}\n\n"
                    "Format numbers intelligently — round floats to 2 decimal places, add units where obvious (e.g. 'years', 'customers'). "
                    "If the question would benefit from a chart, populate the `chart` field, otherwise set it to null. "
                    "`chart` should contain only the top 5–10 items for readability. "
                    "Always set `result` as the human-readable answer, not a raw number. "
                    "Do not include any explanations, markdown code blocks, or text. Only return the raw JSON object."
                )
            }
        ]
        
        return data_summary

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
            cleaned = self.code_executor.clean_code(assistant_reply)
            execution_result = self.code_executor.execute_code(cleaned, self.df)
            
            # 6. Check for execution errors
            if isinstance(execution_result, str) and (execution_result.startswith("Error:") or execution_result.startswith("Execution Error:")):
                if attempt < max_retries - 1:
                    print(f"[Self-Healing] Execution failed on attempt {attempt + 1}. Asking AI to fix...")
                    error_prompt = f"The code failed with this error:\n{execution_result}\n\nPlease fix the code and write it again. Ensure the output is ONLY valid Python code."
                    self.conversation_history.append({"role": "user", "content": error_prompt})
                    continue
                else:
                    return f"I'm sorry, I couldn't write the correct code after {max_retries} attempts. Final error: {execution_result}"

            # 7. If no error, return the successful result as a dict
            return {
                "reply": execution_result.get("result", ""),
                "code": execution_result.get("code", ""),
                "chart": execution_result.get("chart", None)
            }
