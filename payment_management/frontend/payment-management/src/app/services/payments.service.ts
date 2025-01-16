import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment } from '../models/payment.model';

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private baseUrl = 'http://localhost:8000/payments';

  constructor(private http: HttpClient) {}

  getPayments(
    search: string = '',
    status: string = '',
    skip: number = 0,
    limit: number = 10
  ): Observable<Payment[]> {
    let params = new HttpParams()
      .set('search', search)
      .set('status', status)
      .set('skip', skip)
      .set('limit', limit);
    return this.http.get<Payment[]>(this.baseUrl, { params });
  }

  getPaymentById(paymentId: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/${paymentId}`);
  }  

  createPayment(payment: Partial<Payment>): Observable<any> {
    return this.http.post(this.baseUrl, payment);
  }

  updatePayment(paymentId: string, data: Partial<Payment>): Observable<Payment> {
    return this.http.put<Payment>(`${this.baseUrl}/${paymentId}`, data);
  }

  deletePayment(paymentId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${paymentId}`);
  }

  uploadEvidence(paymentId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/upload-evidence/${paymentId}`, formData);
  }

  downloadEvidence(paymentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download-evidence/${paymentId}`, {
      responseType: 'blob',
    });
  }
}
