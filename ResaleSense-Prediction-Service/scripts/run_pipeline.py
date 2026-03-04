# scripts/run_pipeline.py

# Import all the processing scripts from the 'processing' subfolder
from processing import process_01_schools
from processing import process_02_hawkers
from processing import process_03_preschools
from processing import process_04_mrt
from processing import process_05_malls
from processing import process_06_hdb_prices

# Import the model retraining script
import retrain_model

def main():
    """
    This is the master script to run the entire data pipeline and model retraining.
    """
    print("=====================================================")
    print("===   STARTING ResaleSense DATA PIPELINE   ===")
    print("=====================================================\n")
    
    # --- STAGE 1: DATA PROCESSING ---
    # Run each data cleaning and preparation script in order.
    process_01_schools.main()
    process_02_hawkers.main()
    process_03_preschools.main()
    process_04_mrt.main()
    process_05_malls.main()
    process_06_hdb_prices.main()
    
    print("\n-----------------------------------------------------")
    print("---      ALL DATASETS PROCESSED SUCCESSFULLY      ---")
    print("-----------------------------------------------------\n")

    # --- STAGE 2: MODEL RETRAINING ---
    # Now that the data is clean, run the model retraining script.
    retrain_model.main()

    print("\n=====================================================")
    print("===   PIPELINE COMPLETED. NEW MODEL IS READY!   ===")
    print("=====================================================\n")

if __name__ == "__main__":
    main()