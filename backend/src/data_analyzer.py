import pandas as pd

class DataAnalyzer:
    def get_summary(self, df):
        """Generates a text summary of the dataset for context ingestion."""
        if df is None:
            return "No dataset loaded."

        parts = [
            "--- Dataset Summary ---",
            f"Rows: {df.shape[0]}, Columns: {df.shape[1]}",
            "",
            f"Column Names and Data Types:\n{df.dtypes.to_string()}",
            "",
            f"Missing Values:\n{df.isnull().sum().to_string()}",
            "",
            f"Summary Statistics:\n{df.describe(include='all').to_string()}",
        ]

        # describe(include='all') only exposes count/unique/top/freq for text
        # columns, not the actual category labels — spell those out for any
        # low-cardinality text column so the model can reference real values.
        low_cardinality_cols = [
            c for c in df.select_dtypes(include=["object", "category"]).columns
            if df[c].nunique(dropna=True) <= 20
        ]
        if low_cardinality_cols:
            parts.append("")
            parts.append("Unique values for low-cardinality text columns:")
            for c in low_cardinality_cols:
                parts.append(f"  {c}: {df[c].dropna().unique().tolist()}")

        parts.append("-----------------------")
        return "\n".join(parts)
