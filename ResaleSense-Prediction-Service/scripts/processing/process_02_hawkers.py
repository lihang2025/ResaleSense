# scripts/processing/process_02_hawkers.py

import pandas as pd
import requests
import time
import os
import re # We need the 're' module for regular expressions

# --- CONFIGURATION ---
INPUT_FILE = os.path.join("..", "data_raw", "ListofGovernmentMarketsHawkerCentres.csv")
OUTPUT_FILE = os.path.join("..", "data_processed", "hawker-centres.csv")

# --- NEW HELPER FUNCTION ---
def extract_postal_code(address_string):
    """
    Uses regular expressions to find and extract a 6-digit postal code
    from a messy address string.
    """
    # This pattern looks for a sequence of exactly 6 digits (\d{6})
    match = re.search(r'(\d{6})', address_string)
    if match:
        return match.group(1) # Return the found postal code
    return None # Return None if no 6-digit number is found

# The geocode_address function remains the same, but it will now receive postal codes
def geocode_address(search_value):
    """Uses the OneMap API to get coordinates and road name for a postal code or address."""
    try:
        url = f"https://www.onemap.gov.sg/api/common/elastic/search?searchVal={search_value}&returnGeom=Y&getAddrDetails=Y"
        response = requests.get(url)
        data = response.json()
        
        if data and data['found'] > 0:
            result = data['results'][0]
            return result.get('LATITUDE'), result.get('LONGITUDE'), result.get('ROAD_NAME')
        else:
            print(f"  - WARNING: API could not find coordinates for: {search_value}")
            return None, None, None
            
    except Exception as e:
        print(f"  - ERROR: An API error occurred for {search_value}: {e}")
        return None, None, None

def main():
    """Main function to process the hawker centre data."""
    print("\n--- Starting Task 2: Processing Hawker Centre Data (Improved Version) ---")

    print(f"Step 1: Reading raw data from {INPUT_FILE}")
    hawker_df = pd.read_csv(INPUT_FILE)

    print("Step 2: Extracting postal codes and geocoding locations...")
    location_data = []
    
    # --- MODIFICATION START ---
    # We now loop through the raw addresses, extract the postal code first, then geocode.
    for address in hawker_df['location_of_centre']:
        postal_code = extract_postal_code(address)
        
        if postal_code:
            print(f"  - Found postal code '{postal_code}' from address '{address[:40]}...'")
            time.sleep(0.1)  # API delay
            lat, lon, street = geocode_address(postal_code)
            location_data.append({'latitude': lat, 'longitude': lon, 'street': street})
        else:
            print(f"  - FAILED: Could not find a postal code in address: {address}")
            # Append empty data if no postal code is found
            location_data.append({'latitude': None, 'longitude': None, 'street': None})
    # --- MODIFICATION END ---

    location_df = pd.DataFrame(location_data)
    final_df = pd.concat([hawker_df.reset_index(drop=True), location_df], axis=1)

    final_df = final_df[['name_of_centre', 'street', 'latitude', 'longitude']].copy()
    final_df.dropna(inplace=True)

    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f"\n✅ Success! Processed file with {len(final_df)} locations saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()