import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentsService } from '../../../services/payments.service';
import { Payment } from '../../../models/payment.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-payment',
  templateUrl: './edit-payment.component.html',
  styleUrls: ['./edit-payment.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class EditPaymentComponent implements OnInit {
  editPaymentForm!: FormGroup;
  paymentId!: string;
  existingPayment?: Payment;
  evidenceFile?: File;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private paymentsService: PaymentsService
  ) {}

  ngOnInit(): void {
    this.paymentId = this.route.snapshot.paramMap.get('id') || '';
    this.initForm();
    this.loadPayment();
  }

  initForm() {
    this.editPaymentForm = this.fb.group({
      payee_due_date: ['', Validators.required],
      due_amount: [0, Validators.required],
      payee_payment_status: ['pending', Validators.required]
    });
  }

  loadPayment() {
    this.paymentsService.getPaymentById(this.paymentId).subscribe({
      next: (payment: Payment) => {
        this.existingPayment = payment;

        this.editPaymentForm.patchValue({
          payee_due_date: payment.payee_due_date,
          due_amount: payment.due_amount,
          payee_payment_status: payment.payee_payment_status
        });
      },
      error: (err: any) => {
        console.error(err);
        alert('Could not load payment.');
      }
    });
  }

  onSubmit() {
    if (this.editPaymentForm.invalid) {
      this.editPaymentForm.markAllAsTouched();
      return;
    }

    const updateData = this.editPaymentForm.value;

    if (updateData.payee_payment_status === 'completed' && !this.evidenceFile) {
      alert('Please upload evidence before marking this payment as completed.');
      return;
    }

    this.paymentsService.updatePayment(this.paymentId, updateData).subscribe({
      next: (updated: Payment) => {
        if (updateData.payee_payment_status === 'completed' && this.evidenceFile) {
          this.uploadEvidenceAndRedirect();
        } else {
          alert('Payment updated successfully!');
          this.router.navigate(['/payments']);
        }
      },
      error: (err) => {
        alert(err?.error?.detail || 'Error updating payment.');
      }
    });
  }

  uploadEvidenceAndRedirect() {
    if (!this.evidenceFile) return;
    this.paymentsService.uploadEvidence(this.paymentId, this.evidenceFile).subscribe({
      next: () => {
        alert('Evidence uploaded successfully!');
        this.router.navigate(['/payments']);
      },
      error: (err) => {
        alert(err?.error?.detail || 'Evidence upload failed.');
      }
    });
  }

  onFileSelected(event: any) {
    const fileList: FileList = event.target.files;
    if (fileList && fileList.length > 0) {
      this.evidenceFile = fileList[0];
    }
  }
}
