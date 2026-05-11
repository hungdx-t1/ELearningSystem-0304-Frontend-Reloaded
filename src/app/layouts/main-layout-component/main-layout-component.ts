import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SlicePipe], 
  templateUrl: './main-layout-component.html',
  styleUrl: './main-layout-component.scss',
})
export class MainLayoutComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);

  isSidebarOpen = signal<boolean>(false);
  isDarkMode = signal<boolean>(false);

  ngOnInit() {
    // Đọc cài đặt Cấu hình sáng/tối từ LocalStorage
    const savedTheme = localStorage.getItem('lms_theme');
    // Nếu họ từng chọn dark hoặc hệ điều hành của họ là dark -> Bật ngay lập tức
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDarkMode.set(true);
      document.documentElement.classList.add('dark');
    }
  }

  toggleTheme() {
    const isDark = !this.isDarkMode();
    this.isDarkMode.set(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lms_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lms_theme', 'light');
    }
  }

  menuItems = [
    { path: '/dashboard', icon: '🏠', label: 'Bảng điều khiển' },
  //  { path: '/courses', icon: '📚', label: 'Khóa học tự do' },
    { path: '/classes', icon: '🏫', label: 'Lớp học của tôi' },
    { path: '/submission-history', icon: '📝', label: 'Lịch sử bài làm' },
    { path: '/chat', icon: '🤖', label: 'Trợ lý AI' }
  ];

  toggleSidebar() {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}