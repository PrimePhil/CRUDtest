import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentsService } from '../../../services/payments.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule
  ]
})
export class AddPaymentComponent implements OnInit {
  addPaymentForm!: FormGroup;
  countries: string[] = [];
  currencies: string[] = [];

  constructor(
    private fb: FormBuilder,
    private paymentsService: PaymentsService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCountries();
    this.loadCurrencies();
  }

  initForm() {
    this.addPaymentForm = this.fb.group({
      payee_first_name: ['', Validators.required],
      payee_last_name: ['', Validators.required],
      payee_due_date: ['', Validators.required],
      payee_address_line_1: ['', Validators.required],
      payee_address_line_2: [''],
      payee_city: ['', Validators.required],
      payee_country: ['', Validators.required],
      payee_province_or_state: [''],
      payee_postal_code: ['', Validators.required],
      payee_phone_number: ['', Validators.required],
      payee_email: ['', [Validators.required, Validators.email]],
      currency: ['', Validators.required],
      discount_percent: [0],
      tax_percent: [0],
      due_amount: [0, Validators.required],
    });
  }

  onBack() {
    this.router.navigate(['/payments']);
  }

  loadCountries() {
    this.http.get<any[]>('https://restcountries.com/v3.1/all')
      .subscribe({
        next: (res) => {
          this.countries = res
            .map(country => country.name?.common)
            .filter(name => !!name)
            .sort();
        },
        error: (err) => {
          console.error('Error loading countries:', err);
        }
      });
  }  

  loadCurrencies() {
    this.currencies = ['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'NZD', 'JPY'];
  }
  
  onSubmit() {
    if (this.addPaymentForm.invalid) {
      this.addPaymentForm.markAllAsTouched();
      return;
    }

    const newPaymentData = this.addPaymentForm.value;

    this.paymentsService.createPayment(newPaymentData).subscribe({
      next: () => {
        alert('Payment created successfully!');
        this.router.navigate(['/payments']);
      },
      error: (err) => {
        console.error(err);
        alert('Error creating payment.');
      }
    });
  }
}
