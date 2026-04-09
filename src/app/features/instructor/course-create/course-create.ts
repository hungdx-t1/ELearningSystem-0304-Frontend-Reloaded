import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { NotificationService } from '../../../../v2/app/core/services/notification.service';

@Component({
  selector: 'app-course-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './course-create.html'
})
export class CourseCreate implements OnInit {
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute); // Tiêm thêm bộ đọc URL
  private notiService = inject(NotificationService);

  courseForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    thumbnailUrl: [''],
    isPublic: [false]
  });

  isLoading = signal<boolean>(false);
  isFetching = signal<boolean>(false); // Trạng thái tải dữ liệu cũ
  errorMessage = signal<string>('');
  
  courseId = signal<string | null>(null); // Lưu ID nếu đang ở chế độ sửa

  ngOnInit() {
    // Kéo ID từ URL (nếu có)
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.courseId.set(id);
      this.isFetching.set(true);
      // Gọi API lấy dữ liệu cũ đắp lên form
      this.courseService.getCourseById(id).then(course => {
        this.courseForm.patchValue({
          title: course.title,
          description: course.description || '',
          thumbnailUrl: course.thumbnailUrl || '',
          isPublic: course.isPublic || false
        });
        this.isFetching.set(false);
      }).catch(err => {
        this.notiService.error('Không tìm thấy thông tin khóa học!');
        this.router.navigate(['/instructor/courses']);
      });
    }
  }

  onSubmit() {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched(); 
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const payload = this.courseForm.getRawValue();

    // phân làn: đang sửa hay tạo mới dựa vào việc có courseId hay không
    if (this.courseId()) {
      // Gọi API Cập nhật (PUT)
      this.courseService.updateCourse(this.courseId()!, payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.notiService.success('Đã cập nhật thông tin khóa học!');
          this.router.navigate(['/instructor/courses']); 
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set('Lỗi cập nhật. Vui lòng thử lại!');
        }
      });
    } else {
      // Gọi API Tạo mới (POST)
      this.courseService.createCourse(payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.notiService.success('Đã xuất bản khóa học mới!');
          this.router.navigate(['/instructor/courses']); 
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set('Có lỗi xảy ra khi tạo khóa học. Vui lòng thử lại!');
        }
      });
    }
  }
}