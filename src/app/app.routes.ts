import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login'; 
import { MainLayoutComponent } from './layouts/main-layout-component/main-layout-component';
import { DashboardComponent } from './features/dashboard-component/dashboard-component';
import { authGuard } from './core/guards/auth.guard';
import { NotFoundComponent } from './features/not-found-component/not-found-component';
import { CourseDetail } from './features/courses/course-detail-component/course-detail-component';
import { ClassListComponent } from './features/classes/class-list-component/class-list-component';
import { AiChatComponent } from './features/chat/ai-chat-component/ai-chat-component';

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent }, 
      { path: 'courses', redirectTo: 'dashboard' }, // Nếu bấm vào Khóa Học thì đá về trang chủ tạm thời
      { path: 'courses/:id', component: CourseDetail },
      { path: 'classes', component: ClassListComponent },
      { path: 'chat', component: AiChatComponent },
    ]
  },

  // gõ link bậy bạ -> Đá về login
  { path: '**', component: NotFoundComponent }
];