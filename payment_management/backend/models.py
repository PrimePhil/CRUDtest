from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import date, datetime

class PaymentBase(BaseModel):
    payee_first_name: str
    payee_last_name: str
    payee_payment_status: str  # e.g. "completed", "due_now", "overdue", "pending"
    payee_added_date_utc: Optional[datetime]
    payee_due_date: date
    payee_address_line_1: str
    payee_address_line_2: Optional[str]
    payee_city: str
    payee_country: str
    payee_province_or_state: Optional[str]
    payee_postal_code: str
    payee_phone_number: str
    payee_email: EmailStr
    currency: str
    discount_percent: Optional[float] = 0.0
    tax_percent: Optional[float] = 0.0
    due_amount: float

class PaymentCreate(PaymentBase):
    """Used when creating a new payment."""

class PaymentUpdate(BaseModel):
    payee_due_date: Optional[date]
    due_amount: Optional[float]
    payee_payment_status: Optional[str]

class PaymentResponse(PaymentBase):
    id: str = Field(..., alias="_id")
    total_due: Optional[float]

    class Config:
        allow_population_by_field_name = True
