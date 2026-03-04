# scripts/processing/process_06_hdb_prices.py

import pandas as pd
import os

# --- CONFIGURATION ---
INPUT_FILE = os.path.join("..", "data_raw", "ResaleflatpricesbasedonregistrationdatefromJan2017onwards.csv")
OUTPUT_FILE = os.path.join("..", "data_processed", "resale-flat-prices-based-on-registration-date-from-jan-2017-onwards.csv")
def main():
    """
    Main function to process the HDB resale price data.
    Currently, this is a simple copy, but can be expanded for cleaning later.
    """
    print("\n--- Starting Task 6: Processing Main HDB Resale Data ---")

    # 1. Load the raw dataset
    print(f"Step 1: Reading raw data from {INPUT_FILE}")
    hdb_df = pd.read_csv(INPUT_FILE)

    # 2. Save a copy to the processed folder
    print(f"Step 2: Saving to processed data folder.")
    hdb_df.to_csv(OUTPUT_FILE, index=False)
    
    print(f"✅ Success! Main HDB data file ready for use. Saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()