import { Component, inject, OnInit, signal } from '@angular/core';
import { Course, CourseService } from '../../../core/services/course.service';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './course-management.html'
})
export class CourseManagement implements OnInit {
  private courseService = inject(CourseService);

  courses = signal<Course[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    // Tạm thời kéo toàn bộ khóa học. 
    // Tương lai Backend của bạn nên có API riêng kiểu: GET /api/courses/instructor/{id}
    this.courseService.getAllCourses().subscribe({
      next: (data) => {
        this.courses.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách:', err);
        this.isLoading.set(false);
      }
    });
  }

  deleteCourse(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa khóa học này không? Toàn bộ bài giảng sẽ bị mất!')) {
      // TODO: Gọi API Xóa  
      alert('Chức năng xóa sẽ sớm được kích hoạt!');
    }
  }
}