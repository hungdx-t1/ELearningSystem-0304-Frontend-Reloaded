import { Component, inject, signal } from '@angular/core';
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
export class MainLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  isSidebarOpen = signal<boolean>(false);

  menuItems = [
    { path: '/dashboard', icon: '🏠', label: 'Bảng điều khiển' },
    { path: '/courses', icon: '📚', label: 'Khóa học tự do' },
    { path: '/classes', icon: '🏫', label: 'Lớp học của tôi' },
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