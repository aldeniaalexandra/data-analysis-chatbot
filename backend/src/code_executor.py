import re
import pandas as pd
import json

class CodeExecutor:
    def clean_code(self, code_string):
        """Strips markdown and parses the JSON from the AI's response."""
        # Find everything between ```json and ```
        match = re.search(r"```(?:json)?\s*\n(.*?)\n```", code_string, re.DOTALL)
        if match:
            code_string = match.group(1).strip()
        else:
            code_string = code_string.strip()
            
        try:
            return json.loads(code_string)
        except json.JSONDecodeError as e:
            return {"error": f"Invalid JSON response: {str(e)}", "raw": code_string}

    def execute_code(self, parsed_json, df):
        """
        Executes the generated Python code safely and returns the JSON payload.
        """
        # If clean_code failed to parse JSON, it returns a dict with an 'error' key
        # We stringify it so ChatBot's error logic (startswith "Error:") catches it!
        if isinstance(parsed_json, dict) and "error" in parsed_json:
            return f"Error: {parsed_json['error']}"
            
        code_string = parsed_json.get("code", "")
        local_env = {"df": df, "pd": pd}
        
        try:
            # We execute the code snippet just to ensure it runs without syntax/runtime errors!
            if code_string:
                exec(code_string, {}, local_env)
            
            # The AI already provided the nicely format human-readable 'result' text in the JSON
            # so we just return the full parsed JSON object directly back to ChatBot
            return parsed_json
                
        except Exception as e:
            return f"Execution Error: {str(e)}"
