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

    # Restricted builtins — block os, subprocess, sys, import, open, exec, eval, compile
    _SAFE_BUILTINS = {
        k: v for k, v in __builtins__.items()
        if k in (
            "abs", "all", "any", "bool", "dict", "divmod", "enumerate",
            "filter", "float", "format", "frozenset", "getattr", "hasattr",
            "hash", "int", "isinstance", "issubclass", "iter", "len", "list",
            "map", "max", "min", "next", "print", "range", "repr", "reversed",
            "round", "set", "slice", "sorted", "str", "sum", "tuple", "type",
            "zip", "True", "False", "None", "ValueError", "TypeError",
            "KeyError", "IndexError", "AttributeError", "Exception",
        )
    } if isinstance(__builtins__, dict) else {
        k: getattr(__builtins__, k) for k in (
            "abs", "all", "any", "bool", "dict", "divmod", "enumerate",
            "filter", "float", "format", "frozenset", "getattr", "hasattr",
            "hash", "int", "isinstance", "issubclass", "iter", "len", "list",
            "map", "max", "min", "next", "print", "range", "repr", "reversed",
            "round", "set", "slice", "sorted", "str", "sum", "tuple", "type",
            "zip", "True", "False", "None", "ValueError", "TypeError",
            "KeyError", "IndexError", "AttributeError", "Exception",
        ) if hasattr(__builtins__, k)
    }

    def execute_code(self, parsed_json, df):
        """
        Executes the generated Python code in a restricted environment.
        """
        if isinstance(parsed_json, dict) and "error" in parsed_json:
            return f"Error: {parsed_json['error']}"

        code_string = parsed_json.get("code", "")
        safe_globals = {"__builtins__": self._SAFE_BUILTINS}
        local_env = {"df": df, "pd": pd}

        try:
            if code_string:
                exec(code_string, safe_globals, local_env)
            return parsed_json
        except Exception as e:
            return f"Execution Error: {str(e)}"
