import pandas as pd
from datetime import datetime
from payment_management.backend.database import payments_collection

def normalize_csv_and_store(csv_path: str):
    df = pd.read_csv(csv_path)
    
    df['payee_added_date_utc'] = df['payee_added_date_utc'].apply(
        lambda x: datetime.utcfromtimestamp(x) if not pd.isnull(x) else None
    )

    records = df.to_dict(orient='records')
    
    if records:
        payments_collection.insert_many(records)
