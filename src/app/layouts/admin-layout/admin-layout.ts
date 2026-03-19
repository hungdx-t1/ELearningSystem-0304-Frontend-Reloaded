import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SlicePipe],
  templateUrl: './admin-layout.html'
})
export class AdminLayout {
  public authService = inject(AuthService);
  private router = inject(Router);

  menuItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Tổng quan hệ thống' },
    { path: '/admin/users', icon: '👥', label: 'Quản lý Người dùng' },
    { path: '/admin/training', icon: '🏫', label: 'Quản lý Đào tạo' },
    { path: '/admin/settings', icon: '⚙️', label: 'Cài đặt hệ thống' }
  ];

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}