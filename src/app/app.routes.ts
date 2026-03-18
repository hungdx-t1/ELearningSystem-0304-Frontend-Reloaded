import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login'; 
import { MainLayoutComponent } from './layouts/main-layout-component/main-layout-component';
import { DashboardComponent } from './features/dashboard-component/dashboard-component';
import { authGuard } from './core/guards/auth.guard';
import { NotFoundComponent } from './features/not-found-component/not-found-component';
import { CourseDetail } from './features/courses/course-detail-component/course-detail-component';
import { ClassListComponent } from './features/classes/class-list-component/class-list-component';
import { AiChatComponent } from './features/chat/ai-chat-component/ai-chat-component';
import { LessonPlayerComponent } from './features/courses/lesson-player-component/lesson-player-component';
import { CourseManagement } from './features/instructor/course-management/course-management';
import { CourseCreate } from './features/instructor/course-create/course-create';
import { CourseEditor } from './features/instructor/course-editor/course-editor';
import { TrainingManagement } from './features/admin/training-management/training-management';
import { UserManagement } from './features/admin/user-management/user-management';
import { AdminLayout } from './layouts/admin-layout/admin-layout';

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
      { path: 'courses/:courseId/lessons/:lessonId', component: LessonPlayerComponent },
      
      { path: 'instructor/courses', component: CourseManagement },
      { path: 'instructor/courses/create', component: CourseCreate },
      { path: 'instructor/courses/:id/manage', component: CourseEditor },
    ]
  },

  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: UserManagement },
      { path: 'training', component: TrainingManagement },
    ]
  },

  // gõ link bậy bạ -> Đá về login
  { path: '**', component: NotFoundComponent }
];