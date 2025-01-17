from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pymongo import ReturnDocument
from datetime import datetime, date
from payment_management.backend.database import payments_collection, fs
from payment_management.backend.models import PaymentCreate, PaymentUpdate, PaymentResponse
from bson.objectid import ObjectId
import math
import io

router = APIRouter(prefix="/payments", tags=["payments"])

def calculate_total_due(due_amount: float, discount_percent: float, tax_percent: float) -> float:
    if not discount_percent:
        discount_percent = 0
    if not tax_percent:
        tax_percent = 0
    
    discounted = due_amount - (due_amount * discount_percent / 100.0)
    taxed = discounted + (discounted * tax_percent / 100.0)
    return round(taxed, 2)

from datetime import date

def adjust_payment_status(payment):
    today_ = date.today()
    
    due_str = payment.get("payee_due_date")

    if isinstance(due_str, str):
        due_date_obj = date.fromisoformat(due_str)
    else:
        due_date_obj = due_str

    if due_date_obj == today_ and payment["payee_payment_status"] != "completed":
        payment["payee_payment_status"] = "due_now"
    elif due_date_obj and due_date_obj < today_ and payment["payee_payment_status"] != "completed":
        payment["payee_payment_status"] = "overdue"
    
    return payment



@router.get("/")
def get_payments(
    search: str = "",
    status: str = "",
    skip: int = 0,
    limit: int = 10
):

    query = {}

    if status:
        query["payee_payment_status"] = status

    if search:
        query["$or"] = [
            {"payee_first_name": {"$regex": search, "$options": "i"}},
            {"payee_last_name": {"$regex": search, "$options": "i"}},
            {"payee_city": {"$regex": search, "$options": "i"}},
            {"payee_email": {"$regex": search, "$options": "i"}},
        ]

    payments_cursor = payments_collection.find(query).skip(skip).limit(limit)
    payments = list(payments_cursor)

    for p in payments:
        p = adjust_payment_status(p)
        total_due = calculate_total_due(
            p["due_amount"],
            p.get("discount_percent", 0),
            p.get("tax_percent", 0)
        )
        p["total_due"] = total_due
        p["_id"] = str(p["_id"])

        payments_collection.update_one(
            {"_id": p["_id"]},
            {"$set": {"payee_payment_status": p["payee_payment_status"]}}
        )

    return payments


@router.post("/")
def create_payment(payment_data: PaymentCreate):
    payment_data.payee_payment_status = "pending"

    payment_dict = payment_data.model_dump()

    result = payments_collection.insert_one(payment_dict)
    return {"inserted_id": str(result.inserted_id)}


@router.put("/{payment_id}")
def update_payment(payment_id: str, update_data: PaymentUpdate):
    if update_data.payee_payment_status == "completed":
        existing_file = fs.find_one({"filename": payment_id})
        if not existing_file:
            raise HTTPException(status_code=400, detail="Cannot mark as completed without evidence.")
    
    update_dict = {k: v for k, v in update_data.model_dump(exclude_unset=True).items() if v is not None}

    updated_payment = payments_collection.find_one_and_update(
        {"_id": ObjectId(payment_id)},
        {"$set": update_dict},
        return_document=ReturnDocument.AFTER
    )

    if not updated_payment:
        raise HTTPException(status_code=404, detail="Payment not found.")

    return updated_payment

@router.get("/{payment_id}")
def get_payment_by_id(payment_id: str):
    payment = payments_collection.find_one({"_id": ObjectId(payment_id)})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")
    payment["_id"] = str(payment["_id"])
    return payment


@router.delete("/{payment_id}")
def delete_payment(payment_id: str):
    result = payments_collection.delete_one({"_id": ObjectId(payment_id)})
    if result.deleted_count == 1:
        return {"success": True}
    else:
        return {"error": "Payment not found."}


@router.post("/upload-evidence/{payment_id}")
def upload_evidence(payment_id: str, file: UploadFile = File(...)):
    if file.content_type not in ["application/pdf", "image/png", "image/jpeg"]:
        raise HTTPException(status_code=400, detail="File must be PDF, PNG, or JPG.")

    file_content = file.file.read()

    existing_file = fs.find_one({"filename": payment_id})
    if existing_file:
        fs.delete(existing_file._id)

    fs.put(file_content, filename=payment_id, contentType=file.content_type)

    return {"message": "Evidence file uploaded successfully."}


@router.get("/download-evidence/{payment_id}")
def download_evidence(payment_id: str):
    file_doc = fs.find_one({"filename": payment_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="No evidence found.")

    return StreamingResponse(
        io.BytesIO(file_doc.read()),
        media_type=file_doc.contentType,
        headers={
            "Content-Disposition": f"attachment; filename={payment_id}"
        }
    )

