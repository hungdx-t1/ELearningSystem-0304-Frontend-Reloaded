import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login'; 

export const routes: Routes = [
  // Nếu vào trang chủ (localhost:4200) thì tự động chuyển hướng sang trang login
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  { path: 'login', component: Login },
  
  // TODO: (Sau này các trang khác như Dashboard, Course sẽ thêm vào dưới này)
];