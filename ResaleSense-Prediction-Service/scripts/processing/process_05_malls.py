# scripts/processing/process_05_malls.py

import pandas as pd
import os

# --- CONFIGURATION ---
INPUT_FILE = os.path.join("..", "data_raw", "shopping_mall_coordinates.csv")
OUTPUT_FILE = os.path.join("..", "data_processed", "shopping_mall_lat_long.csv")

def main():
    """Main function to process the shopping mall data."""
    print("\n--- Starting Task 5: Processing Shopping Mall Data ---")

    # 1. Load the raw dataset
    print(f"Step 1: Reading raw data from {INPUT_FILE}")
    mall_df = pd.read_csv(INPUT_FILE)

    # 2. Rename columns for consistency with the main model script
    print("Step 2: Standardizing column names.")
    mall_df.rename(columns={
        'Mall Name': 'mall_name',
        'LATITUDE': 'latitude',
        'LONGITUDE': 'longitude'
    }, inplace=True)
    
    # 3. Select only the necessary columns
    final_df = mall_df[['mall_name', 'latitude', 'longitude']].copy()

    # 4. Save the processed file
    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f"✅ Success! Processed file with {len(final_df)} malls saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()