import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { MainLayoutComponent } from './layouts/main-layout-component/main-layout-component';
import { DashboardComponent } from './features/dashboard-component/dashboard-component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { NotFoundComponent } from './features/not-found-component/not-found-component';
import { NoPermissionComponent } from './features/no-permission/no-permission';
import { CourseDetail } from './features/courses/course-detail-component/course-detail-component';
import { ClassListComponent } from './features/classes/class-list-component/class-list-component';
import { AiChatComponent } from './features/chat/ai-chat-component/ai-chat-component';
import { LessonPlayerComponent } from './features/courses/lesson-player-component/lesson-player-component';
import { CourseManagement } from './features/instructor/course-management/course-management';
import { CourseCreate } from './features/instructor/course-create/course-create';
import { CourseEditor } from './features/instructor/course-editor/course-editor';
import { UserManagement } from './features/admin/user-management/user-management';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { AdminDashboard } from './features/admin/admin-dashboard/admin-dashboard';
import { ClassManagement } from './features/instructor/class-management/class-management';
import { AdminClassManagement } from './features/admin/class-management/class-management';
import { AdminCourseManagement } from './features/admin/course-management/course-management';
import { QuizBuilder } from './features/instructor/quiz-builder/quiz-builder';
import { AssignmentGrading } from './features/instructor/assignment-grading/assignment-grading';
import { InstructorClassDetail } from './features/instructor/class-detail/class-detail';

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'courses', redirectTo: 'dashboard' },
      { path: 'courses/:id', component: CourseDetail },
      { path: 'classes', component: ClassListComponent },
      { path: 'chat', component: AiChatComponent },
      { path: 'courses/:courseId/lessons/:lessonId', component: LessonPlayerComponent },

      // khu vực giảng viên (Admin và Instructor được vào, Student bị cấm)
      {
        path: 'instructor/courses',
        component: CourseManagement,
        canActivate: [roleGuard],
        data: { roles: ['Instructor', 'Admin'] }, // Truyền data quy định quyền
      },
      {
        path: 'instructor/courses/create',
        component: CourseCreate,
        canActivate: [roleGuard],
        data: { roles: ['Instructor', 'Admin'] },
      },
      {
        path: 'instructor/courses/:id/manage',
        component: CourseEditor,
        canActivate: [roleGuard],
        data: { roles: ['Instructor', 'Admin'] },
      },
      {
        path: 'instructor/classes',
        component: ClassManagement,
        canActivate: [roleGuard],
        data: { roles: ['Instructor', 'Admin'] },
      },
      {
        path: 'instructor/classes/:id', 
        component: InstructorClassDetail,
        canActivate: [roleGuard],
        data: { roles: ['Instructor', 'Admin'] },
      },
      {
        path: 'instructor/courses/:courseId/quizzes/:lessonId',
        component: QuizBuilder,
        canActivate: [roleGuard],
        data: { roles: ['Instructor', 'Admin'] },
      },
      {
        path: 'instructor/assignments',
        component: AssignmentGrading,
        canActivate: [roleGuard],
        data: { roles: ['Instructor', 'Admin'] },
      },
    ],
  },

  // khu vực admin
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard], // Phải đăng nhập và phải có quyền
    data: { roles: ['Admin'] }, // Chỉ mỗi Admin
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboard },
      { path: 'users', component: UserManagement },
      { path: 'classes', component: AdminClassManagement },
      { path: 'courses', component: AdminCourseManagement },
    ],
  },

  // Trang cấm truy cập 403
  { path: 'no-permission', component: NoPermissionComponent },

  // Gõ link bậy bạ ra 404
  { path: '**', component: NotFoundComponent },
];
