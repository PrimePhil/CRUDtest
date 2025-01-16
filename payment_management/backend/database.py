from pymongo import MongoClient
import gridfs
import os

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")

client = MongoClient(MONGO_URI)
db = client["payment_management_db"]
payments_collection = db["payments"]

fs = gridfs.GridFS(db)
