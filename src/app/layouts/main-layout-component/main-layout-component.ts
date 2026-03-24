import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SlicePipe], 
  templateUrl: './main-layout-component.html',
  styleUrl: './main-layout-component.scss',
})
export class MainLayoutComponent {
  authService = inject(AuthService);

  private router = inject(Router);

  // Danh sách menu bên trái (sau này bạn thêm bớt tùy ý)
  menuItems = [
    { path: '/dashboard', icon: '🏠', label: 'Trang chủ' },
    { path: '/courses', icon: '📚', label: 'Khóa học' },
    { path: '/classes', icon: '🏫', label: 'Lớp học' },
    { path: '/chat', icon: '🤖', label: 'Trợ lý AI' }, 
    // { path: '/instructor/courses', icon: '👨‍🏫', label: 'Quản lý khóa học' },
    // { path: '/instructor/classes', icon: '👨‍🏫', label: 'Quản lý lớp học' },  // tạm thời
    // { path: '/instructor/assignments', icon: '👨‍🏫', label: 'Chấm điểm bài tập' },  // tạm thời
  ];

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}