import pandas as pd

class DataAnalyzer:
    def get_summary(self, df):
        """Generates a text summary of the dataset for context ingestion."""
        if df is None:
            return "No dataset loaded."
            
        summary = (
            f"--- Dataset Summary ---\n"
            f"Rows: {df.shape[0]}, Columns: {df.shape[1]}\n\n"
            f"Column Names and Data Types:\n{df.dtypes.to_string()}\n\n"
            f"Missing Values:\n{df.isnull().sum().to_string()}\n\n"
            f"Summary Statistics:\n{df.describe(include='all').to_string()}\n"
            f"-----------------------"
        )
        return summary
