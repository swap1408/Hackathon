import pandas as pd
from datetime import datetime
import os

def etl_city_data():
    print("🚀 Starting ETL pipeline...")

    # Step 1: Ingest
    df = pd.DataFrame({
        "location": ["Hyderabad", "Mumbai", "Chennai"],
        "speed": [25, 18, 40]
    })

    # Step 2: Transform
    df["timestamp"] = datetime.now()
    df["congestion_level"] = df["speed"].apply(lambda s: "high" if s < 20 else "low")

    # Step 3: Load
    os.makedirs("data_output", exist_ok=True)
    df.to_csv("data_output/traffic_processed.csv", index=False)

    print(" ETL completed. Saved to data_output/traffic_processed.csv")

if __name__ == "__main__":
    etl_city_data()
