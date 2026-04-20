import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'instructor-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SlicePipe],
  templateUrl: './instructor-layout.html'
})
export class InstructorLayout implements OnInit {
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
    { path: '/instructor/courses', icon: '🏫', label: 'Khóa học' },
    { path: '/instructor/classes', icon: '🏛️', label: 'Lớp học' },
    { path: '/instructor/assignments', icon: '📝', label: 'Bài tập' },
    // { path: '/instructor/quizzes', icon: '📝', label: 'Kiểm tra' } comment tạm thời
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