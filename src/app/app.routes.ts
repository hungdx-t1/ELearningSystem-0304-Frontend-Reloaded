import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { MainLayoutComponent } from './layouts/main-layout-component/main-layout-component';
import { DashboardComponent } from './features/student/dashboard-component/dashboard-component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { NotFoundComponent } from './features/not-found-component/not-found-component';
import { ComingSoonComponent } from './features/coming-soon/coming-soon.component';
import { NoPermissionComponent } from './features/no-permission/no-permission';
import { CourseDetail } from './features/student/courses/course-detail-component/course-detail-component';
import { ClassListComponent } from './features/student/classes/class-list-component/class-list-component';
import { AiChatComponent } from './features/student/chat/ai-chat-component/ai-chat-component';
import { LessonPlayerComponent } from './features/student/courses/lesson-player-component/lesson-player-component';
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
import { InstructorLayout } from './layouts/instructor-layout/instructor-layout';
import { rootRedirectGuard } from './core/guards/root-redirect.guard';
import { AiChatHistoryComponent } from './features/student/chat/ai-chat-history-component/ai-chat-history-component';
import { SubmissionHistory } from './features/student/submission-history/submission-history';

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard, rootRedirectGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [roleGuard],
        data: { roles: ['Student'] },
      },
      {
        path: 'courses',
        redirectTo: 'dashboard',
        pathMatch: 'full' 
      },
      {
        path: 'courses/:id',
        component: CourseDetail,
        canActivate: [roleGuard],
        data: { roles: ['Student'] },
      },
      {
        path: 'classes',
        component: ClassListComponent,
        canActivate: [roleGuard],
        data: { roles: ['Student'] },
      },
      {
        path: 'chat',
        component: AiChatComponent,
        canActivate: [roleGuard],
        data: { roles: ['Student'] },
      },
      {
        path: 'courses/:courseId/lessons/:lessonId',
        component: LessonPlayerComponent,
        canActivate: [roleGuard],
        data: { roles: ['Student'] },
      },
      {
        path: 'chat-history',
        component: AiChatHistoryComponent,
        canActivate: [roleGuard],
        data: { roles: ['Student'] }
      },
      {
        path: 'submission-history',
        component: SubmissionHistory,
        canActivate: [roleGuard],
        data: { roles: ['Student'] }
      }
    ],
  },

  // khu vực giảng viên (instructor)
  {
    path: 'instructor',
    component: InstructorLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Instructor'] },
    children: [
      { path: '', redirectTo: 'courses', pathMatch: 'full' },
      { path: 'courses', component: CourseManagement },
      { path: 'courses/create', component: CourseCreate },
      { path: 'courses/:id/edit', component: CourseCreate },
      { path: 'courses/:id/manage', component: CourseEditor },
      { path: 'classes', component: ClassManagement },
      { path: 'classes/:id', component: InstructorClassDetail },
      { path: 'courses/:courseId/quizzes/:lessonId', component: QuizBuilder },
      { path: 'assignments', component: AssignmentGrading },
    ],
  },

  // khu vực admin
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['Admin'] }, 
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboard },
      { path: 'users', component: UserManagement },
      { path: 'classes', component: AdminClassManagement },
      { path: 'courses', component: AdminCourseManagement },
      { path: 'settings', component: ComingSoonComponent },
    ],
  },

  { path: 'no-permission', component: NoPermissionComponent },
  { path: '**', component: NotFoundComponent },
];