import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login'; 
import { MainLayoutComponent } from './layouts/main-layout-component/main-layout-component';
import { DashboardComponent } from './features/dashboard-component/dashboard-component';

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      // Vào cổng '/' thì đẩy thẳng vào trang dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      // Bến đỗ chính thức đây rồi!
      { path: 'dashboard', component: DashboardComponent }, 
    ]
  },

  // gõ link bậy bạ -> Đá về login
  { path: '**', redirectTo: 'login' }
];