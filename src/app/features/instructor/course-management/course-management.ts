import { Component, inject, OnInit, signal } from '@angular/core';
import { Course, CourseService } from '../../../core/services/course.service';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../../../../v2/app/core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './course-management.html'
})
export class CourseManagement implements OnInit {
  private courseService = inject(CourseService);
  private notiService = inject(NotificationService);
  public authService = inject(AuthService);

  courses = signal<Course[]>([]);
  isLoading = signal<boolean>(true);
  currentUserId = this.authService.getCurrentUserId();

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
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
      this.courseService.deleteCourse(id).subscribe({
        next: () => {
          this.notiService.success('Đã xóa khóa học!');
          this.loadCourses();
        },
        error: (err) => this.notiService.error('Lỗi xóa: ' + (err.error?.message || err.message))
      });
    }
  }

  copyCourse(id: string) {
    if (confirm('Bạn có muốn sao chép toàn bộ khóa học này về thư viện của mình không?')) {
      this.courseService.copyCourse(id).subscribe({
        next: () => {
          this.notiService.success('🎉 Sao chép thành công!');
          this.loadCourses();
        },
        error: (err) => this.notiService.error('Lỗi sao chép: ' + (err.error?.message || err.message))
      });
    }
  }
}