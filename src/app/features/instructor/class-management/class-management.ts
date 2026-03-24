import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClassService } from '../../../core/services/class.service';
import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-class-management',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './class-management.html'
})
export class ClassManagement implements OnInit {
  private fb = inject(FormBuilder);
  
  // Tiêm 2 service vào
  private classService = inject(ClassService);
  private courseService = inject(CourseService);

  courses = signal<any[]>([]);
  classes = signal<any[]>([]);

  isLoading = signal<boolean>(false);
  selectedCourseId = signal<string>(''); 

  isModalOpen = signal<boolean>(false);
  modalMode = signal<'add' | 'edit'>('add');
  selectedClassId = signal<string | null>(null);

  classForm = this.fb.group({
    courseId: ['', Validators.required],
    classCode: ['', Validators.required],
    className: ['', Validators.required],
    academicYear: ['2025-2026'],
    googleMeetLink: [''],
    description: ['']
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    // Kéo danh sách Khóa học để đổ vào Dropdown bộ lọc
    this.courseService.getAllCourses().subscribe({
      next: (data) => this.courses.set(data),
      error: (err) => console.error('Lỗi tải khóa học:', err)
    });

    // Kéo danh sách Lớp học phần
    this.classService.getAllClasses().subscribe({
      next: (data) => {
        this.classes.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi tải lớp học:', err);
        this.isLoading.set(false);
      }
    });
  }

  filteredClasses = computed(() => {
    const filterId = this.selectedCourseId();
    if (!filterId) return this.classes(); 
    return this.classes().filter(c => c.courseId === filterId);
  });

  getCourseName(courseId: string): string {
    const course = this.courses().find(c => c.id === courseId);
    return course ? course.title : 'Chưa xác định';
  }

  openAddModal() {
    this.modalMode.set('add');
    this.classForm.reset({ courseId: this.selectedCourseId(), academicYear: '2025-2026' }); 
    this.isModalOpen.set(true);
  }

  openEditModal(cls: any) {
    this.modalMode.set('edit');
    this.selectedClassId.set(cls.id);
    this.classForm.patchValue(cls);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  // LƯU LỚP HỌC XUỐNG DB
  saveClass() {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    const formVal = this.classForm.value;

    if (this.modalMode() === 'add') {
      this.classService.createClass(formVal).subscribe({
        next: () => {
          alert('Tạo lớp học thành công!');
          this.loadData();
          this.closeModal();
        },
        error: (err) => alert('Lỗi tạo lớp: ' + (err.error?.message || err.message))
      });
    } else {
      const classId = this.selectedClassId();
      if (classId) {
        this.classService.updateClass(classId, formVal).subscribe({
          next: () => {
            alert('Cập nhật lớp học thành công!');
            this.loadData();
            this.closeModal();
          },
          error: (err) => alert('Lỗi cập nhật: ' + (err.error?.message || err.message))
        });
      }
    }
  }

  // XÓA LỚP HỌC
  deleteClass(cls: any) {
    if (confirm(`Bạn có chắc muốn xóa lớp ${cls.classCode}? Toàn bộ sinh viên trong lớp sẽ bị ảnh hưởng!`)) {
      this.classService.deleteClass(cls.id).subscribe({
        next: () => {
          this.classes.update(list => list.filter(c => c.id !== cls.id));
        },
        error: (err) => alert('Lỗi xóa lớp: ' + (err.error?.message || err.message))
      });
    }
  }
}