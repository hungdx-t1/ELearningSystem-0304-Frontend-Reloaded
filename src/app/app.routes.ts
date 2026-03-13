import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login'; 
import { MainLayoutComponent } from './layouts/main-layout-component/main-layout-component';

export const routes: Routes = [
  // Nếu vào trang chủ (localhost:4200) thì tự động chuyển hướng sang trang login
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  { path: 'login', component: Login },

  {
    path: '',
    component: MainLayoutComponent, // Bọc ngoài cùng
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      // Tương lai chúng ta sẽ gắn các trang vào đây:
      // { path: 'dashboard', component: DashboardComponent },
      // { path: 'courses', component: CourseListComponent },
    ]
  },

  // gõ link bậy bạ -> Đá về Trang chủ
  { path: '**', redirectTo: '' }
  
  // TODO: (Sau này các trang khác như Dashboard, Course sẽ thêm vào dưới này)
];