import { Component, OnInit } from '@angular/core';
import { PaymentsService } from '../../../services/payments.service';
import { Payment } from '../../../models/payment.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ]
})
export class MainComponent implements OnInit {
  payments: Payment[] = [];
  searchText = '';
  statusFilter = '';
  skip = 0;
  limit = 10;
  totalDue = 0;

  constructor(private paymentsService: PaymentsService, private router: Router) {}

  ngOnInit(): void {
    this.fetchPayments();
  }

  fetchPayments() {
    this.paymentsService
      .getPayments(this.searchText, this.statusFilter, this.skip, this.limit)
      .subscribe({
        next: (res) => {
          this.payments = res;

          this.totalDue = this.payments.reduce((acc, p) => acc + (p.total_due || 0), 0);
        },
        error: (err) => {
          console.error('Error fetching payments:', err);
        },
      });
  }

  onAddPayment() {
    this.router.navigate(['/payments/add']);
  }

  onSearchChange() {
    this.skip = 0;
    this.fetchPayments();
  }

  onStatusFilterChange() {
    this.skip = 0;
    this.fetchPayments();
  }

  nextPage() {
    this.skip += this.limit;
    this.fetchPayments();
  }

  prevPage() {
    if (this.skip >= this.limit) {
      this.skip -= this.limit;
      this.fetchPayments();
    }
  }

  onDeletePayment(paymentId: string) {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    this.paymentsService.deletePayment(paymentId).subscribe({
      next: () => {
        this.fetchPayments();
      },
      error: (err) => {
        alert('Could not delete payment.');
      }
    });
  }


  onUploadEvidence(paymentId: string, event: any) {
    const file = event.target.files[0];
    this.paymentsService.uploadEvidence(paymentId, file).subscribe({
      next: () => {
        alert('Evidence uploaded successfully.');
      },
      error: (err: { error: { detail: any; }; }) => {
        alert(err.error.detail || 'Upload failed.');
      },
    });
  }

  onDownloadEvidence(paymentId: string) {
    this.paymentsService.downloadEvidence(paymentId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-${paymentId}-evidence`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        alert(err.error?.detail || 'No evidence file found');
      }
    });
  }
}