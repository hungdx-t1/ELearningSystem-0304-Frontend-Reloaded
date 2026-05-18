import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  public authService = inject(AuthService); // Public để dùng ngoài HTML (ví dụ check role)

  // Signals quản lý dữ liệu
  allCourses = signal<any[]>([]);
  myClasses = signal<any[]>([]); // Danh sách lớp đang học
  completedCount = signal<number>(0);
  averageScore = signal<number>(0);
  
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // Thông tin cá nhân
  studentName = signal<string>('Học viên');
  realStudentId = '';

  ngOnInit() {
    // Lấy Tên và ID thật từ Local Storage
    const user = this.authService.userProfile();
    if (user && user.fullName) {
      this.studentName.set(user.fullName);
    }
    this.realStudentId = this.authService.getCurrentUserId();

    this.fetchDashboardData();
  }

  fetchDashboardData() {
    this.isLoading.set(true);
    this.dashboardService.getStudentDashboard().subscribe({
      next: (data) => {
        this.myClasses.set(data.myClasses || []);
        this.allCourses.set(data.allCourses || []);
        this.completedCount.set(data.completedCount || 0);
        this.averageScore.set(data.averageScore || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi tải dashboard', err);
        this.errorMessage.set('Không thể kết nối đến máy chủ để tải dữ liệu!');
        this.isLoading.set(false);
      }
    });
  }
}