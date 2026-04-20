import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SlicePipe],
  templateUrl: './admin-layout.html'
})
export class AdminLayout implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);

  isSidebarOpen = signal<boolean>(false);
  isDarkMode = signal<boolean>(false);

  ngOnInit() {
    const savedTheme = localStorage.getItem('lms_theme');
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
    { path: '/admin/dashboard', icon: '📊', label: 'Tổng quan hệ thống' },
    { path: '/admin/users', icon: '👥', label: 'Quản lý Người dùng' },
    { path: '/admin/settings', icon: '⚙️', label: 'Cài đặt hệ thống' }
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