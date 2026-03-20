import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CourseService, Course } from '../../../core/services/course.service';
import { DatePipe, SlicePipe } from '@angular/common';

@Component({
  selector: 'app-admin-course-management',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, SlicePipe],
  templateUrl: './course-management.html'
})
export class AdminCourseManagement implements OnInit {
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);

  courses = signal<Course[]>([]);
  isLoading = signal<boolean>(false);
  searchQuery = signal<string>('');

  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.courses().filter(c => c.title.toLowerCase().includes(query));
  });

  isModalOpen = signal<boolean>(false);
  modalMode = signal<'add' | 'edit'>('add');
  selectedCourseId = signal<string | null>(null);

  courseForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: [''],
    thumbnailUrl: ['']
  });

  ngOnInit() { this.loadCourses(); }

  loadCourses() {
    this.isLoading.set(true);
    // Tạm dùng dữ liệu giả để bạn test UI, khi có API thật thì uncomment
    this.courses.set([
      { id: '1', title: 'Lập trình Web Cơ bản', description: 'HTML, CSS, JS', thumbnailUrl: '', createdAt: new Date().toISOString() },
      { id: '2', title: 'Cấu trúc Dữ liệu & Giải thuật', description: 'C/C++', thumbnailUrl: '', createdAt: new Date().toISOString() }
    ]);
    this.isLoading.set(false);
  }

  openAddModal() {
    this.modalMode.set('add');
    this.courseForm.reset();
    this.isModalOpen.set(true);
  }

  openEditModal(course: Course) {
    this.modalMode.set('edit');
    this.selectedCourseId.set(course.id);
    this.courseForm.patchValue(course);
    this.isModalOpen.set(true);
  }

  closeModal() { this.isModalOpen.set(false); }

  saveCourse() {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }
    alert('Đã lưu Khóa học thành công!');
    this.closeModal();
  }

  deleteCourse(course: Course) {
    if (confirm(`Xóa môn học "${course.title}"?`)) {
      this.courses.update(list => list.filter(c => c.id !== course.id));
    }
  }
}