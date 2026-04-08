import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { NotificationService } from '../../../../v2/app/core/services/notification.service';

@Component({
  selector: 'app-course-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './course-create.html'
})
export class CourseCreate {
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private router = inject(Router);

  private notiService = inject(NotificationService);

  courseForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    thumbnailUrl: [''], // Link ảnh thì không bắt buộc
    isPublic: [false]
  });

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  onSubmit() {
    // Nếu form lỗi (chưa nhập đủ) thì cấm submit
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched(); // Hiện đỏ hết các ô lỗi lên
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Gọi API lưu xuống DB
    this.courseService.createCourse(this.courseForm.getRawValue()).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Lưu thành công thì đá về lại trang Quản lý khóa học
        this.router.navigate(['/instructor/courses']); 
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Có lỗi xảy ra khi tạo khóa học. Vui lòng thử lại!');
        console.error(err);
      }
    });
  }
}