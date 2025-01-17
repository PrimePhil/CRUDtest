import { Routes } from '@angular/router';
import { MainComponent } from './components/payments/main/main.component';
import { AddPaymentComponent } from './components/payments/add-payment/add-payment.component';
import { EditPaymentComponent } from './components/payments/edit-payment/edit-payment.component';

export const routes: Routes = [
    { path: '', redirectTo: 'payments', pathMatch: 'full' },
    { path: 'payments', component: MainComponent },
    { path: 'payments/add', component: AddPaymentComponent },
    { path: 'payments/edit/:id', component: EditPaymentComponent },
];
