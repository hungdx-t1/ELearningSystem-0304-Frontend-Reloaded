import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive], 
  templateUrl: './main-layout-component.html',
  styleUrl: './main-layout-component.scss',
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Danh sách menu bên trái (sau này bạn thêm bớt tùy ý)
  menuItems = [
    { path: '/dashboard', icon: '🏠', label: 'Trang chủ' },
    { path: '/courses', icon: '📚', label: 'Khóa học' },
    { path: '/classes', icon: '🏫', label: 'Lớp học' },
    { path: '/chat', icon: '🤖', label: 'Trợ lý AI' } // Hợp gu làm AI ChatLog của bạn nè
  ];

  logout() {
    this.authService.logout(); // Xóa token
    this.router.navigate(['/login']); // Đá văng ra trang Login
  }
}