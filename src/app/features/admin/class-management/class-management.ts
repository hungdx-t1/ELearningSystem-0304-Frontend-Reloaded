import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
// Import UserService để lấy danh sách giảng viên
// import { UserService, User } from '../../../core/services/user.service';

@Component({
  selector: 'app-admin-class-management',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './class-management.html'
})
export class AdminClassManagement implements OnInit {
  private fb = inject(FormBuilder);
  
  // Dữ liệu giả lập
  courses = signal<any[]>([]);
  classes = signal<any[]>([]);
  instructors = signal<any[]>([]); // Danh sách giảng viên để phân công

  selectedCourseFilter = signal<string>('');

  filteredClasses = computed(() => {
    const courseId = this.selectedCourseFilter();
    if (!courseId) return this.classes();
    return this.classes().filter(c => c.courseId === courseId);
  });

  isModalOpen = signal<boolean>(false);
  modalMode = signal<'add' | 'edit'>('add');

  // FORM CÓ THÊM TRƯỜNG INSTRUCTOR ID
  classForm = this.fb.group({
    courseId: ['', Validators.required],
    classCode: ['', Validators.required],
    className: ['', Validators.required],
    instructorId: ['', Validators.required], // Bắt buộc phải gán GV
    academicYear: ['2025-2026'],
    googleMeetLink: [''],
  });

  ngOnInit() {
    // Giả lập dữ liệu Backend
    this.courses.set([{ id: 'c1', title: 'Lập trình Web' }, { id: 'c2', title: 'Cấu trúc Dữ liệu' }]);
    this.instructors.set([{ id: 'gv1', name: 'Thầy Tuấn (tuan@lms.com)' }, { id: 'gv2', name: 'Cô Lan (lan@lms.com)' }]);
    this.classes.set([
      { id: '1', courseId: 'c1', classCode: 'WEB_L01', className: 'Web Ca Sáng', instructorId: 'gv1', academicYear: '2025' }
    ]);
  }

  getCourseName(id: string) { return this.courses().find(c => c.id === id)?.title || 'Không rõ'; }
  getInstructorName(id: string) { return this.instructors().find(i => i.id === id)?.name || 'Chưa phân công'; }

  openAddModal() {
    this.modalMode.set('add');
    this.classForm.reset({ courseId: this.selectedCourseFilter(), academicYear: '2025-2026' });
    this.isModalOpen.set(true);
  }

  openEditModal(cls: any) {
    this.modalMode.set('edit');
    this.classForm.patchValue(cls);
    this.isModalOpen.set(true);
  }

  closeModal() { this.isModalOpen.set(false); }

  saveClass() {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }
    alert('Đã lưu Lớp học và Phân công Giảng viên thành công!');
    this.closeModal();
  }

  deleteClass(cls: any) { /* Logic xóa */ }
}