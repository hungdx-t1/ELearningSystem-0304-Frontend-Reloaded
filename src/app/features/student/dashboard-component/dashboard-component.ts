import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
// Import Services
import { CourseService, Course } from '../../../core/services/course.service';
import { ClassService } from '../../../core/services/class.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss'
})
export class DashboardComponent implements OnInit {
  
  private courseService = inject(CourseService);
  private classService = inject(ClassService);
  public authService = inject(AuthService); // Public để dùng ngoài HTML (ví dụ check role)

  // Signals quản lý dữ liệu
  allCourses = signal<Course[]>([]);
  myClasses = signal<any[]>([]); // Danh sách lớp đang học
  
  isLoadingCourses = signal<boolean>(true);
  isLoadingClasses = signal<boolean>(true);
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

    this.fetchMyClasses();
    this.fetchAllCourses();
  }

  // Kéo danh sách Lớp học mà SV này đang tham gia
  fetchMyClasses() {
    if (!this.realStudentId) {
      this.isLoadingClasses.set(false);
      return;
    }
    
    this.classService.getStudentClasses(this.realStudentId).subscribe({
      next: (data) => {
        this.myClasses.set(data);
        this.isLoadingClasses.set(false);
      },
      error: (err) => {
        console.error('Lỗi tải lớp học của tôi', err);
        this.isLoadingClasses.set(false);
      }
    });
  }

  // Kéo danh sách toàn bộ Khóa học trên hệ thống
  fetchAllCourses() {
    this.courseService.getAllCourses().subscribe({
      next: (data) => {
        this.allCourses.set(data);
        this.isLoadingCourses.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Không thể kết nối đến máy chủ để tải khóa học!');
        this.isLoadingCourses.set(false);
        console.error(err);
      }
    });
  }
}