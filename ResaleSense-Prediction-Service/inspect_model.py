# inspect_model.py

import joblib

MODEL_FILE_PATH = 'finalized_model.pkl'

print(f"--- Inspecting model file: {MODEL_FILE_PATH} ---\n")

try:
    # Load the model from the .pkl file
    loaded_model = joblib.load(MODEL_FILE_PATH)

    # --- Basic Inspection ---
    print("1. Object Type:")
    print(f"   {type(loaded_model)}\n")

    # --- Scikit-Learn Model Inspection ---
    # The get_params() method shows all the settings of the model
    print("2. Model Parameters (Settings):")
    params = loaded_model.get_params()
    for key, value in params.items():
        print(f"   - {key}: {value}")
    print("\n")

    # Check for learned attributes after training
    if hasattr(loaded_model, 'n_features_in_'):
        print(f"3. Number of Features Expected: {loaded_model.n_features_in_}\n")

    if hasattr(loaded_model, 'feature_importances_'):
        print(f"4. Model has feature importance scores available.\n")
        
except FileNotFoundError:
    print(f"ERROR: The file '{MODEL_FILE_PATH}' was not found.")
except Exception as e:
    print(f"An error occurred while loading the model: {e}")