import uvicorn
import os
from fastapi import FastAPI
from payment_management.backend.routes import payments
from payment_management.backend.services import normalize_csv_and_store

app = FastAPI()

app.include_router(payments.router)

@app.on_event("startup")
def startup_event():
    this_dir = os.path.dirname(__file__)
    csv_path = os.path.join(this_dir, "..", "payment_information.csv")  
    normalize_csv_and_store(csv_path)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
