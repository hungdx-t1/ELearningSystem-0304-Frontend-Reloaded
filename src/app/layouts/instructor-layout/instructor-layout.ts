import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'instructor-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SlicePipe],
  templateUrl: './instructor-layout.html'
})
export class InstructorLayout {
  public authService = inject(AuthService);
  private router = inject(Router);

  menuItems = [
    { path: '/instructor/courses', icon: '🏫', label: 'Khóa học' },
    { path: '/instructor/classes', icon: '🏛️', label: 'Lớp học' },
    { path: '/instructor/assignments', icon: '📝', label: 'Bài tập' },
    // { path: '/instructor/quizzes', icon: '📝', label: 'Kiểm tra' } comment tạm thời
  ];

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}