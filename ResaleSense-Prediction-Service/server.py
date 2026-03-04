# ResaleSense-Prediction-Service/server.py
import os
import joblib
import pandas as pd
import shap
import requests
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

# --- CONFIGURATION (Unchanged) ---
MODEL_FILE_PATH = 'finalized_model.pkl'
PROCESSED_DATA_DIR = 'data_processed'
FINAL_MODEL_COLUMNS = [
    'floor_area_sqm', 'bedroom', 'mean_floor', 'remaining_year', 'dist_to_mrt', 'dist_to_mall', 'dist_to_hawker', 
    'dist_to_child_centre', 'dist_to_city', 'dist_to_pri_sch', 'town_ANG MO KIO', 'town_BEDOK', 'town_BISHAN', 
    'town_BUKIT BATOK', 'town_BUKIT MERAH', 'town_BUKIT PANJANG', 'town_BUKIT TIMAH', 'town_CENTRAL AREA', 
    'town_CHOA CHU KANG', 'town_CLEMENTI', 'town_GEYLANG', 'town_HOUGANG', 'town_JURONG EAST', 'town_JURONG WEST', 
    'town_KALLANG/WHAMPOA', 'town_MARINE PARADE', 'town_PASIR RIS', 'town_PUNGGOL', 'town_QUEENSTOWN', 'town_SENGKANG', 
    'town_SERANGOON', 'town_TAMPINES', 'town_TOA PAYOH', 'town_YISHUN', 'flat_type_2 ROOM', 'flat_type_3 ROOM', 
    'flat_type_4 ROOM', 'flat_type_5 ROOM', 'flat_type_EXECUTIVE', 'flat_type_MULTI-GENERATION', 
    'flat_model_Adjoined flat', 'flat_model_Apartment', 'flat_model_DBSS', 'flat_model_Improved', 
    'flat_model_Maisonette', 'flat_model_Model A', 'flat_model_New Generation', 'flat_model_Standard'
]

# --- LOAD MODELS AND AMENITY DATA (Unchanged) ---
model = joblib.load(MODEL_FILE_PATH)
explainer = shap.TreeExplainer(model)
amenity_files = {
    'mrt': pd.read_csv(os.path.join(PROCESSED_DATA_DIR, 'mrt_lrt_data.csv')),
    'mall': pd.read_csv(os.path.join(PROCESSED_DATA_DIR, 'shopping_mall_lat_long.csv')),
    'hawker': pd.read_csv(os.path.join(PROCESSED_DATA_DIR, 'hawker-centres.csv')),
    'child_centre': pd.read_csv(os.path.join(PROCESSED_DATA_DIR, 'childcare-centres.csv')),
    'pri_sch': pd.read_csv(os.path.join(PROCESSED_DATA_DIR, 'sg-primary-schools.csv'))
}
print("Model, Explainer, and Amenity Data loaded successfully.")


# --- HELPER FUNCTIONS ---
def get_coords_from_address(block, street_name):
    # ... (function unchanged) ...
    search_val = f"{block} {street_name}"
    url = f"https://www.onemap.gov.sg/api/common/elastic/search?searchVal={search_val}&returnGeom=Y&getAddrDetails=Y"
    try:
        response = requests.get(url)
        data = response.json()
        if data and data['found'] > 0:
            return float(data['results'][0]['LATITUDE']), float(data['results'][0]['LONGITUDE'])
    except Exception as e:
        print(f"Error fetching coordinates for '{search_val}': {e}")
    return None, None

def calculate_distance(lat1, lon1, lat2, lon2):
    # ... (function unchanged) ...
    R = 6371000
    dLat = np.radians(lat2 - lat1)
    dLon = np.radians(lon2 - lon1)
    a = np.sin(dLat / 2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dLon / 2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return R * c

# --- UPDATED: Amenity distance function ---
def calculate_amenity_distances(block, street_name):
    """Calculates and returns a list of amenity objects within 500m."""
    lat, lon = get_coords_from_address(block, street_name)
    if not lat or not lon:
        raise ValueError("Could not get coordinates for the given address.")

    nearby_amenities = []
    
    for amenity_type, df in amenity_files.items():
        # Calculate distance for all amenities of this type
        distances = df.apply(lambda row: calculate_distance(lat, lon, row['latitude'], row['longitude']), axis=1)
        
        # Find the index of the minimum distance
        min_dist_idx = distances.idxmin()
        min_dist = distances[min_dist_idx]
        
        if min_dist <= 500:
            # Get the details of the closest amenity
            closest_amenity = df.loc[min_dist_idx]
            amenity_name = ""
            
            # Get the name based on the file type (column names are different)
            if 'name' in df.columns:
                amenity_name = closest_amenity['name']
            elif 'centre_name' in df.columns:
                amenity_name = closest_amenity['centre_name']
            elif 'school_name' in df.columns:
                amenity_name = closest_amenity['school_name']
            elif 'hawker_centre_name' in df.columns:
                amenity_name = closest_amenity['hawker_centre_name']
            
            nearby_amenities.append({
                "name": amenity_name,
                "type": amenity_type.replace('_', ' ').title(),
                "distance": f"{min_dist:,.0f}m",
                "lat": closest_amenity['latitude'],
                "lon": closest_amenity['longitude']
            })

    # Note: We are no longer including 'City Center' as it's rarely within 500m
    # and doesn't fit the "nearby" paradigm for the map.
    
    # Sort by distance
    sorted_amenities = sorted(nearby_amenities, key=lambda x: int(x['distance'].replace('m', '').replace(',', '')))
    
    return sorted_amenities
# --- END UPDATED ---

def process_and_predict(json_data):
    # ... (function unchanged) ...
    current_year = int(json_data['month'].split('-')[0])
    lease_commence_date = int(json_data['lease_commence_date'])
    remaining_year = 99 - (current_year - lease_commence_date)
    storey_range = json_data['storey_range']
    mean_floor = (int(storey_range.split(' ')[0]) + int(storey_range.split(' ')[2])) / 2
    flat_type_mapping = {'1 ROOM': 0, '2 ROOM': 1, '3 ROOM': 2, '4 ROOM': 3, '5 ROOM': 4, 'EXECUTIVE': 5, 'MULTI-GENERATION': 6}
    bedroom_count = flat_type_mapping.get(json_data['flat_type'], 2)
    lat, lon = get_coords_from_address(json_data['block'], json_data['street_name'])
    if not lat: raise ValueError("Could not get coordinates for the given address.")
    distances = {}
    for name, df in amenity_files.items():
        min_dist = min(df.apply(lambda row: calculate_distance(lat, lon, row['latitude'], row['longitude']), axis=1))
        distances[f'dist_to_{name}'] = min_dist
    distances['dist_to_city'] = calculate_distance(lat, lon, 1.2839, 103.8514)
    data_for_df = {
        'town': json_data['town'], 'flat_type': json_data['flat_type'],
        'floor_area_sqm': float(json_data['floor_area_sqm']), 'flat_model': json_data['flat_model'],
        'remaining_year': remaining_year, 'mean_floor': mean_floor, 'bedroom': bedroom_count,
        **distances
    }
    input_df = pd.DataFrame([data_for_df])
    encoded_df = pd.get_dummies(input_df)
    final_df = encoded_df.reindex(columns=FINAL_MODEL_COLUMNS, fill_value=0)
    prediction = model.predict(final_df)
    shap_values = explainer.shap_values(final_df)
    contributions = sorted(zip(final_df.columns, final_df.iloc[0], shap_values[0]), key=lambda x: abs(x[2]), reverse=True)
    frontend_explanation = []
    for feature, value, shap_value in contributions[:5]:
        if abs(shap_value) > 0.01:
            frontend_explanation.append({
                "feature": feature.replace('_', ' ').title(),
                "effect": "increases" if shap_value > 0 else "decreases",
                "value": abs(shap_value)
            })
    return {
        'predicted_price': round(prediction[0], 2),
        'explanation': frontend_explanation,
        'base_value': explainer.expected_value[0],
        'detailed_contributions': contributions
    }

# --- PREDICTION API ENDPOINT (Unchanged) ---
@app.route('/predict-range', methods=['POST'])
def predict_range():
    # ... (function unchanged) ...
    try:
        json_data = request.get_json()
        base_property_details = json_data['property']
        years = json_data['years']
        results = []
        for year in years:
            data_for_year = {**base_property_details, "month": f"{year}-10"}
            result = process_and_predict(data_for_year)
            results.append({
                "year": year,
                "predictedPrice": result['predicted_price'],
                "explanation": result['explanation'],
                "baseValue": result['base_value']
            })
        return jsonify(results)
    except Exception as e:
        print(f"❌ An error occurred during prediction: {e}")
        return jsonify({'error': str(e)}), 400

# --- UPDATED AMENITIES API ENDPOINT ---
@app.route('/amenities', methods=['POST'])
def get_amenities():
    try:
        json_data = request.get_json()
        block = json_data['block']
        street_name = json_data['street_name']
        
        print(f"[Python] Received request for amenities near {block} {street_name}")

        # This function now returns the list of objects
        amenities_list = calculate_amenity_distances(block, street_name)
        
        # Just return the list directly
        return jsonify(amenities_list)

    except Exception as e:
        print(f"❌ An error occurred while fetching amenities: {e}")
        return jsonify({'error': str(e)}), 400
# --- END UPDATED ---

# --- SERVER STARTUP ---
if __name__ == '__main__':
    # Use port 5000 (which your Node.js code is calling)
    app.run(port=5000, debug=True)