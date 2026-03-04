# scripts/processing/process_04_mrt.py

import pandas as pd
import os

# --- CONFIGURATION ---
INPUT_FILE = os.path.join("..", "data_raw", "mrt_lrt_stations_2025-01-14.csv")
OUTPUT_FILE = os.path.join("..", "data_processed", "mrt_lrt_data.csv")

def main():
    """Main function to process the MRT/LRT station data."""
    print("\n--- Starting Task 4: Processing MRT/LRT Data ---")

    # 1. Load the raw dataset
    print(f"Step 1: Reading raw data from {INPUT_FILE}")
    mrt_df = pd.read_csv(INPUT_FILE)

    # 2. Select and rename the required columns
    # Your model needs 'latitude' and 'longitude'. This file has them.
    print("Step 2: Selecting and renaming required columns.")
    
    # Check if the expected columns exist
    required_columns = ['station_name', 'latitude', 'longitude']
    if not all(col in mrt_df.columns for col in required_columns):
        print(f"  - ERROR: The input file is missing one of the required columns: {required_columns}")
        return

    final_df = mrt_df[required_columns].copy()
    
    # Optional: Rename for consistency if needed, but the names are already good.
    # final_df.rename(columns={'station_name': 'mrt_station'}, inplace=True)

    # 3. Save the processed file
    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f"✅ Success! Processed file with {len(final_df)} stations saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()