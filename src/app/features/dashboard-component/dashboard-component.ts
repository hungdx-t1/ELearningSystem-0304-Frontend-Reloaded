import { Component, inject, OnInit, signal } from '@angular/core';
import { CourseService, Course } from '../../core/services/course.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-component',
  imports: [RouterLink],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss',
})
export class DashboardComponent implements OnInit {
  
  private courseService = inject(CourseService);

  // Khai báo các Signal để kiểm soát giao diện
  courses = signal<Course[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // Hàm này tự động chạy ngay khi người dùng vừa mở trang Dashboard lên
  ngOnInit() {
    this.fetchCourses();
  }

  fetchCourses() {
    this.courseService.getAllCourses().subscribe({
      next: (data) => {
        this.courses.set(data); // Lưu data từ API vào Signal
        this.isLoading.set(false); // Tắt hiệu ứng quay vòng vòng
      },
      error: (err) => {
        this.errorMessage.set('Không thể kết nối đến máy chủ để tải khóa học!');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }
}
