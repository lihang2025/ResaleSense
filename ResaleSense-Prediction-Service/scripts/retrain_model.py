# scripts/retrain_model.py

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
import joblib
import os

print("--- Script Starting: Model Retraining ---")

# --- 1. CONFIGURATION ---
PROCESSED_DATA_DIR = os.path.join("..", "data_processed")
HDB_DATA_FILE = os.path.join(PROCESSED_DATA_DIR, "resale-flat-prices-based-on-registration-date-from-jan-2017-onwards.csv")
MRT_DATA_FILE = os.path.join(PROCESSED_DATA_DIR, "mrt_lrt_data.csv")
MALL_DATA_FILE = os.path.join(PROCESSED_DATA_DIR, "shopping_mall_lat_long.csv")
HAWKER_DATA_FILE = os.path.join(PROCESSED_DATA_DIR, "hawker-centres.csv")
CHILDCARE_DATA_FILE = os.path.join(PROCESSED_DATA_DIR, "childcare-centres.csv")
PRI_SCHOOL_DATA_FILE = os.path.join(PROCESSED_DATA_DIR, "sg-primary-schools.csv")

FINAL_MODEL_OUTPUT_PATH = os.path.join("..", "finalized_model.pkl")

FINAL_MODEL_COLUMNS = [
    'floor_area_sqm', 'bedroom', 'mean_floor', 'remaining_year',
    'dist_to_mrt', 'dist_to_mall', 'dist_to_hawker', 'dist_to_child_centre',
    'dist_to_city', 'dist_to_pri_sch', 'town_ANG MO KIO', 'town_BEDOK',
    'town_BISHAN', 'town_BUKIT BATOK', 'town_BUKIT MERAH', 'town_BUKIT PANJANG',
    'town_BUKIT TIMAH', 'town_CENTRAL AREA', 'town_CHOA CHU KANG',
    'town_CLEMENTI', 'town_GEYLANG', 'town_HOUGANG', 'town_JURONG EAST',
    'town_JURONG WEST', 'town_KALLANG/WHAMPOA', 'town_MARINE PARADE',
    'town_PASIR RIS', 'town_PUNGGOL', 'town_QUEENSTOWN', 'town_SENGKANG',
    'town_SERANGOON', 'town_TAMPINES', 'town_TOA PAYOH', 'town_YISHUN',
    'flat_type_2 ROOM', 'flat_type_3 ROOM', 'flat_type_4 ROOM',
    'flat_type_5 ROOM', 'flat_type_EXECUTIVE', 'flat_type_MULTI-GENERATION',
    'flat_model_Adjoined flat', 'flat_model_Apartment', 'flat_model_DBSS',
    'flat_model_Improved', 'flat_model_Maisonette', 'flat_model_Model A',
    'flat_model_New Generation', 'flat_model_Standard'
]

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    dLat = np.radians(lat2 - lat1)
    dLon = np.radians(lon2 - lon1)
    a = np.sin(dLat / 2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dLon / 2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return R * c

def load_and_process_data():
    print("Step A: Loading all processed datasets...")
    hdb = pd.read_csv(HDB_DATA_FILE)
    mrt = pd.read_csv(MRT_DATA_FILE)
    mall = pd.read_csv(MALL_DATA_FILE)
    hawker = pd.read_csv(HAWKER_DATA_FILE)
    childcare = pd.read_csv(CHILDCARE_DATA_FILE)
    pri_sch = pd.read_csv(PRI_SCHOOL_DATA_FILE)

    print("Step B: Performing feature engineering...")
    hdb['mean_floor'] = hdb['storey_range'].str.split(' TO ').apply(lambda x: (int(x[0]) + int(x[1])) / 2)
    hdb['remaining_year'] = hdb['remaining_lease'].str.split().apply(lambda x: int(x[0]) + int(x[2])/12 if len(x) > 2 else int(x[0]))
    
    # --- MODIFICATION START ---
    # 1. Extract the number, creating a column with strings and NaNs
    hdb['bedroom'] = hdb['flat_type'].str.extract(r'(\d)')
    
    # 2. Handle the special cases that resulted in NaN
    hdb.loc[hdb['flat_type'] == 'MULTI-GENERATION', 'bedroom'] = 4
    hdb.loc[hdb['flat_type'] == 'EXECUTIVE', 'bedroom'] = 3
    
    # 3. Now that all NaNs are filled, safely convert the column to integer
    hdb['bedroom'] = hdb['bedroom'].astype(int)
    # --- MODIFICATION END ---
    
    print("Step C: Merging for HDB coordinates and calculating distances...")
    # Use the 'street' column from hawker data to find lat/lon for each HDB street
    hdb_lat_long = hawker[['street', 'latitude', 'longitude']].drop_duplicates(subset=['street'])
    hdb = hdb.merge(hdb_lat_long, left_on='street_name', right_on='street', how='left').dropna()

    for amenity_name, amenity_df in [('mrt', mrt), ('mall', mall), ('hawker', hawker), ('child_centre', childcare), ('pri_sch', pri_sch)]:
        hdb[f'dist_to_{amenity_name}'] = hdb.apply(lambda row: min([calculate_distance(row['latitude'], row['longitude'], lat, lon) for lat, lon in zip(amenity_df['latitude'], amenity_df['longitude'])]), axis=1)
    
    city_lat, city_lon = 1.2839, 103.8514
    hdb['dist_to_city'] = hdb.apply(lambda row: calculate_distance(row['latitude'], row['longitude'], city_lat, city_lon), axis=1)

    print("Step D: Performing one-hot encoding...")
    models_to_include = ['Model A', 'Improved', 'New Generation', 'Standard', 'Apartment', 'Maisonette', 'Adjoined flat', 'DBSS']
    hdb = hdb[hdb['flat_model'].isin(models_to_include)]
    encoded_df = pd.get_dummies(hdb, columns=['town', 'flat_type', 'flat_model'])
    
    print("Step E: Aligning columns with the final model structure...")
    X = encoded_df.reindex(columns=FINAL_MODEL_COLUMNS, fill_value=0)
    y = hdb['resale_price']
    
    print("✅ Data processing complete.")
    return X, y

def train_and_save_model(X, y):
    print("Step F: Training the Gradient Boosting Regressor model...")
    gb_model = GradientBoostingRegressor(random_state=42, n_estimators=500, max_depth=10, learning_rate=0.1)
    gb_model.fit(X, y)
    
    print("Step G: Saving the trained model...")
    joblib.dump(gb_model, FINAL_MODEL_OUTPUT_PATH)
    print(f"✅ Model successfully trained and saved to {FINAL_MODEL_OUTPUT_PATH}")

def main():
    """Main function for the retraining script."""
    features, target = load_and_process_data()
    train_and_save_model(features, target)

if __name__ == "__main__":
    main()