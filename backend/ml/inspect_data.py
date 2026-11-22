import os
import pandas as pd

DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "data", "restaurant_sales_stuttgart.csv"))

def inspect():
    if not os.path.exists(DATA_PATH):
        print("Data file does not exist. Run download_data.py first.")
        return
    df = pd.read_csv(DATA_PATH)
    print("=== Mendeley Benchmark Restaurant Sales Inspection ===")
    print(f"Shape: {df.shape}")
    print("\nColumns and Data Types:")
    print(df.dtypes)
    print("\nSample records:")
    print(df.head(5))
    print("\nProducts represented:")
    print(df["product_name"].value_counts())
    print("\nSummary Statistics for Numerical Columns:")
    print(df.describe())

if __name__ == "__main__":
    inspect()
