# hdb_prediction_gb.py (Updated)

import streamlit as st
import pandas as pd
import joblib
import re

# --- 1. LOAD MODEL AND DEFINE FINAL COLUMNS (Done only once) ---
@st.cache_resource
def load_model():
    """Loads the model from the .pkl file."""
    with open('finalized_model.pkl', 'rb') as file:
        model = joblib.load(file)
    return model

model = load_model()

# This is the single source of truth, matching our retraining script exactly.
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


# --- 2. STREAMLIT USER INTERFACE ---
st.title("Singapore HDB Resale Price Predictor")

# Create columns for a cleaner layout
col1, col2 = st.columns(2)

with col1:
    st.header("Flat Details")
    town = st.selectbox("Town", sorted(['TAMPINES', 'YISHUN', 'BEDOK', 'JURONG WEST', 'ANG MO KIO', 'SENGKANG', 'HOUGANG', 'WOODLANDS', 'CHOA CHU KANG', 'BUKIT PANJANG', 'BUKIT MERAH', 'KALLANG/WHAMPOA', 'TOA PAYOH', 'GEYLANG', 'QUEENSTOWN', 'CLEMENTI', 'BUKIT BATOK', 'PASIR RIS', 'SEMBAWANG', 'SERANGOON', 'JURONG EAST', 'PUNGGOL', 'BISHAN', 'CENTRAL AREA', 'MARINE PARADE', 'BUKIT TIMAH']))
    flat_type = st.selectbox("Flat Type", sorted(['4 ROOM', '5 ROOM', '3 ROOM', 'EXECUTIVE', '2 ROOM', 'MULTI-GENERATION']))
    flat_model = st.selectbox("Flat Model", sorted(['Improved', 'New Generation', 'Model A', 'Standard', 'Apartment', 'Maisonette', 'DBSS', 'Adjoined flat']))
    storey_range = st.text_input("Storey Range (e.g., 04 TO 06)", "04 TO 06")
    
with col2:
    st.header("Size and Lease")
    floor_area_sqm = st.number_input("Floor Area (sqm)", min_value=30.0, max_value=200.0, value=120.0)
    remaining_lease = st.text_input("Remaining Lease (e.g., 74 years 02 months)", "74 years 02 months")

st.divider()

# New section for the distance features
st.header("Proximity to Amenities (in meters)")
col3, col4, col5 = st.columns(3)
with col3:
    dist_to_mrt = st.number_input("Distance to MRT", value=500.0)
    dist_to_mall = st.number_input("Distance to Mall", value=450.0)
with col4:
    dist_to_hawker = st.number_input("Distance to Hawker", value=300.0)
    dist_to_child_centre = st.number_input("Distance to Childcare", value=250.0)
with col5:
    dist_to_pri_sch = st.number_input("Distance to Primary School", value=600.0)
    dist_to_city = st.number_input("Distance to City (CBD)", value=15000.0)


# --- 3. PREDICTION LOGIC ---
if st.button("Predict Resale Price"):
    try:
        # --- a. Feature Engineering from User Input ---
        storey_list = storey_range.split(' TO ')
        mean_floor = (int(storey_list[0]) + int(storey_list[1])) / 2
        
        years = int(re.search(r'(\d+)\s*year', remaining_lease).group(1))
        months_match = re.search(r'(\d+)\s*month', remaining_lease)
        months = int(months_match.group(1)) if months_match else 0
        remaining_year = years + months / 12

        # Create bedroom count based on flat type
        bedroom = 0
        if 'ROOM' in flat_type:
            bedroom = int(flat_type[0])
        elif flat_type == 'EXECUTIVE':
            bedroom = 3
        elif flat_type == 'MULTI-GENERATION':
            bedroom = 4
        
        # --- b. Create DataFrame from Input ---
        input_data = {
            'town': town,
            'flat_type': flat_type,
            'flat_model': flat_model,
            'floor_area_sqm': floor_area_sqm,
            'mean_floor': mean_floor,
            'remaining_year': remaining_year,
            'bedroom': bedroom,
            'dist_to_mrt': dist_to_mrt,
            'dist_to_mall': dist_to_mall,
            'dist_to_hawker': dist_to_hawker,
            'dist_to_child_centre': dist_to_child_centre,
            'dist_to_city': dist_to_city,
            'dist_to_pri_sch': dist_to_pri_sch
        }
        df_raw = pd.DataFrame([input_data])

        # --- c. One-Hot Encoding and Column Alignment ---
        df_processed = pd.get_dummies(df_raw)
        df_final = df_processed.reindex(columns=FINAL_MODEL_COLUMNS, fill_value=0)

        # --- d. Make Prediction ---
        prediction = model.predict(df_final)
        
        st.header(f"Predicted Resale Price: S${prediction[0]:,.2f}")

    except Exception as e:
        st.error(f"An error occurred: {e}")