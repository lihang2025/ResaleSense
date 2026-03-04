# scripts/processing/process_01_schools.py

import pandas as pd
import requests
import time
import os

# --- CONFIGURATION ---
INPUT_FILE = os.path.join("..", "data_raw", "General information of schools.csv")
OUTPUT_FILE = os.path.join("..", "data_processed", "sg-primary-schools.csv")

def geocode_address(address):
    """Uses the OneMap API to get coordinates for a Singapore address."""
    try:
        url = f"https://www.onemap.gov.sg/api/common/elastic/search?searchVal={address}&returnGeom=Y&getAddrDetails=Y"
        response = requests.get(url)
        data = response.json()
        
        if data and data['found'] > 0:
            result = data['results'][0]
            return result.get('LATITUDE'), result.get('LONGITUDE')
        else:
            print(f"  - WARNING: Could not find coordinates for: {address}")
            return None, None
            
    except Exception as e:
        print(f"  - ERROR: An error occurred for {address}: {e}")
        return None, None

def main():
    """Main function to process the school data."""
    print("--- Starting Task 1: Processing School Data ---")

    # 1. Load the raw dataset
    print(f"Step 1: Reading raw data from {INPUT_FILE}")
    schools_df = pd.read_csv(INPUT_FILE)

    # 2. Filter for only Primary Schools
    print("Step 2: Filtering for 'PRIMARY' schools.")
    primary_schools_df = schools_df[schools_df['mainlevel_code'] == 'PRIMARY'].copy()
    print(f"Found {len(primary_schools_df)} primary schools.")

    # 3. Geocode each school's address
    print("Step 3: Geocoding addresses... (This might take a minute)")
    coordinates = []
    for address in primary_schools_df['address']:
        time.sleep(0.1)  # A small delay to be respectful to the API server
        lat, lon = geocode_address(address)
        coordinates.append({'latitude': lat, 'longitude': lon})

    coords_df = pd.DataFrame(coordinates)
    primary_schools_df = pd.concat([primary_schools_df.reset_index(drop=True), coords_df], axis=1)

    # 4. Select and rename columns for the final output
    final_df = primary_schools_df[['school_name', 'address', 'latitude', 'longitude']].copy()
    
    # Remove any schools we couldn't find coordinates for
    final_df.dropna(subset=['latitude', 'longitude'], inplace=True)

    # 5. Save the processed file
    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f"✅ Success! Processed file saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()