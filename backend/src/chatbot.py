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
                    '  "code": "the pandas code here"\n'
                    "}\n\n"
                    "The `code` must be valid Python operating on the already-loaded DataFrame `df` (and `pd` if needed). "
                    "It MUST assign its final computed answer to a variable named `result` — a number, string, list, "
                    "or dict, whatever fits the question. A bare expression or a `print(...)` call is NOT enough, "
                    "the answer must be assigned: `result = ...`. If the question has multiple parts, combine all "
                    "of them into one `result` value, e.g. a dict with one key per part, so nothing gets dropped.\n"
                    "If the question would benefit from a chart (a ranking, breakdown, or trend across 2+ items), "
                    "ALSO assign a variable named `chart` as a dict with this exact shape, built from REAL values "
                    "your code computed — never invent numbers:\n"
                    '{ "type": "bar" | "pie" | "line", "title": "...", "labels": [...], "values": [...] }\n'
                    "Keep `chart` to the top 5-10 items for readability. Omit it (or assign None) if no chart is warranted.\n"
                    "Do not include any explanations, markdown code blocks, or text outside the JSON. Only return the raw JSON object."
                )
            }
        ]

        return data_summary

    def _phrase_result(self, user_message, result_value):
        """
        Asks the model to phrase a human-readable sentence around a value that
        was already computed by executing the code — the model is not allowed
        to recompute or alter the number itself, only word it naturally.
        """
        messages = [
            {
                "role": "system",
                "content": (
                    "You phrase data-analysis results for end users. You will be given the user's original "
                    "question and the exact computed result — it is already correct and final, do not recompute "
                    "or second-guess it. Respond ONLY with a JSON object: {\"reply\": \"...\"}. The reply must be "
                    "a nicely formatted, human-readable sentence answering the question using the given result "
                    "verbatim (round floats sensibly, add clear units where obvious, e.g. 'years', 'customers'). "
                    "CRITICAL: detect the language of the user's question below and reply in that exact same "
                    "language — never translate or default to another language. If the question is written in "
                    "English, the reply must be entirely in English; if written in Indonesian, the reply must be "
                    "entirely in Indonesian. Do not include markdown, explanations, or text outside the JSON."
                ),
            },
            {
                "role": "user",
                "content": f"Question: {user_message}\nComputed result: {result_value!r}",
            },
        ]
        response = self.client.chat.completions.create(messages=messages, model=self.model)
        parsed = self.code_executor.clean_code(response.choices[0].message.content)
        reply = parsed.get("reply") if isinstance(parsed, dict) else None
        return reply or str(result_value)

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
                    error_prompt = f"The code failed with this error:\n{execution_result}\n\nPlease fix the code and write it again as the same JSON object, with the final answer assigned to a variable named `result`. Ensure the output is ONLY the raw JSON object."
                    self.conversation_history.append({"role": "user", "content": error_prompt})
                    continue
                else:
                    return f"I'm sorry, I couldn't write the correct code after {max_retries} attempts. Final error: {execution_result}"

            # 7. Execution succeeded — phrase the reply from the REAL computed
            #    value, never from the model's own pre-execution guess.
            real_result = execution_result.get("result")
            reply_text = self._phrase_result(user_message, real_result)

            return {
                "reply": reply_text,
                "code": execution_result.get("code", ""),
                "chart": execution_result.get("chart", None)
            }
