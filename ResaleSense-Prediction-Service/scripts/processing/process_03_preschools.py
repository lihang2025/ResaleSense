# scripts/processing/process_03_preschools.py

import pandas as pd
import json
import os

# --- CONFIGURATION ---
INPUT_FILE = os.path.join("..", "data_raw", "PreSchoolsLocation.geojson")
OUTPUT_FILE = os.path.join("..", "data_processed", "childcare-centres.csv")

def main():
    """Main function to process the preschool GeoJSON data."""
    print("\n--- Starting Task 3: Processing Preschool Data (Final Version) ---")

    print(f"Step 1: Reading raw data from {INPUT_FILE}")
    # Using 'utf-8-sig' encoding handles potential hidden characters at the start of the file
    with open(INPUT_FILE, 'r', encoding='utf-8-sig') as f:
        geojson_data = json.load(f)

    print("Step 2: Extracting centre name and coordinates...")
    preschools_list = []
    
    for feature in geojson_data['features']:
        properties = feature['properties']
        geometry = feature['geometry']
        description = properties.get('Description', '')

        # --- MODIFICATION START ---
        # This new method is more robust than the previous regular expression.
        # It splits the string step-by-step to isolate the name.
        centre_name = None
        try:
            # 1. Isolate the part after the header '<th>CENTRE_NAME</th>'
            part1 = description.split('<th>CENTRE_NAME</th>')[1]
            # 2. Isolate the part after the opening data tag '<td>'
            part2 = part1.split('<td>')[1]
            # 3. Isolate the name before the closing data tag '</td>'
            centre_name = part2.split('</td>')[0]
        except IndexError:
            # This will catch any entry where the HTML structure is broken
            # and prevent the script from crashing.
            centre_name = None
        # --- MODIFICATION END ---

        if geometry and geometry['type'] == 'Point':
            longitude, latitude = geometry['coordinates'][:2]
        else:
            longitude, latitude = None, None

        if centre_name and latitude and longitude:
            preschools_list.append({
                'centre_name': centre_name,
                'latitude': latitude,
                'longitude': longitude
            })

    final_df = pd.DataFrame(preschools_list)
    print(f"Successfully extracted {len(final_df)} preschool locations.")

    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f"✅ Success! Processed file saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()