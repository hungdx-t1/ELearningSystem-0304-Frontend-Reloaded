import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CourseService, Course } from '../../../core/services/course.service';
import { DatePipe, SlicePipe } from '@angular/common';

@Component({
  selector: 'app-admin-course-management',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, SlicePipe],
  templateUrl: './course-management.html',
})
export class AdminCourseManagement implements OnInit {
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);

  courses = signal<Course[]>([]);
  isLoading = signal<boolean>(false);
  searchQuery = signal<string>('');

  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.courses().filter((c) => c.title.toLowerCase().includes(query));
  });

  isModalOpen = signal<boolean>(false);
  modalMode = signal<'add' | 'edit'>('add');
  selectedCourseId = signal<string | null>(null);

  courseForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: [''],
    thumbnailUrl: [''],
  });

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.isLoading.set(true);

    this.courseService.getAllCourses().subscribe({
      next: (data) => {
        this.courses.set(data); // Đổ dữ liệu thật từ Backend vào Signal
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách Khóa học:', err);
        alert('Không thể tải dữ liệu từ máy chủ!');
        this.isLoading.set(false);
      },
    });
  }

  openAddModal() {
    this.modalMode.set('add');
    this.courseForm.reset();
    this.isModalOpen.set(true);
  }

  openEditModal(course: Course) {
    this.modalMode.set('edit');
    this.selectedCourseId.set(course.id);
    this.courseForm.patchValue({
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveCourse() {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    const payload = this.courseForm.value as any; // Ép kiểu để gửi

    if (this.modalMode() === 'add') {
      // Gọi API CREATE
      this.courseService.createCourse(payload).subscribe({
        next: () => {
          alert('Đã tạo Khóa học thành công!');
          this.loadCourses(); // Tải lại bảng để thấy dữ liệu mới
          this.closeModal();
        },
        error: (err) => {
          alert('Lỗi khi tạo Khóa học: ' + (err.error?.message || err.message));
        },
      });
    } else {
      const id = this.selectedCourseId();
      if (id) {
        this.closeModal();

        this.courseService.updateCourse(id, payload).subscribe({
          next: () => {
            alert('Cập nhật Khóa học thành công!');
            this.loadCourses();
            this.closeModal();
          },
          error: (err) => alert('Lỗi cập nhật: ' + err.message),
        });
      }
    }
  }

  deleteCourse(course: Course) {
    if (
      confirm(
        `CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn môn học "${course.title}"? Mọi lớp học và bài giảng liên quan có thể bị ảnh hưởng!`,
      )
    ) {
      this.courseService.deleteCourse(course.id).subscribe({
        next: () => {
          // Xóa ngay trên giao diện cho mượt
          this.courses.update((list) => list.filter((c) => c.id !== course.id));
        },
        error: (err) => alert('Lỗi khi xóa: ' + (err.error?.message || err.message)),
      });
    }
  }
}
