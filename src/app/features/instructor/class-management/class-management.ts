import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
// import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-class-management',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './class-management.html'
})
export class ClassManagement implements OnInit {
  private fb = inject(FormBuilder);

  // Dữ liệu giả lập (Tương lai gọi API)
  courses = signal<any[]>([]);
  classes = signal<any[]>([]);

  // Trạng thái hiển thị
  isLoading = signal<boolean>(false);
  selectedCourseId = signal<string>(''); // Khóa học đang được chọn trên bộ lọc

  // Modal State
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
    this.loadMockData();
  }

  loadMockData() {
    // Giả lập dữ liệu từ Backend
    this.courses.set([
      { id: 'c1', title: 'Kiến trúc Phần mềm' },
      { id: 'c2', title: 'Lập trình Web nâng cao' }
    ]);

    this.classes.set([
      { id: '1', courseId: 'c1', classCode: 'SE1501', className: 'Kiến trúc PM - Lớp 1', academicYear: '2025-2026', googleMeetLink: 'https://meet.google.com/abc', students: 40 },
      { id: '2', courseId: 'c1', classCode: 'SE1502', className: 'Kiến trúc PM - Lớp 2', academicYear: '2025-2026', googleMeetLink: '', students: 35 },
      { id: '3', courseId: 'c2', classCode: 'WEB201', className: 'Lập trình Web - Sáng T2', academicYear: '2025-2026', googleMeetLink: 'https://meet.google.com/xyz', students: 50 },
    ]);
  }

  // Lọc lớp học theo Khóa học được chọn
  filteredClasses = computed(() => {
    const filterId = this.selectedCourseId();
    if (!filterId) return this.classes(); // Nếu không chọn khóa nào thì hiện tất cả
    return this.classes().filter(c => c.courseId === filterId);
  });

  // Tìm tên khóa học dựa vào courseId (để hiển thị trên bảng)
  getCourseName(courseId: string): string {
    const course = this.courses().find(c => c.id === courseId);
    return course ? course.title : 'Chưa xác định';
  }

  openAddModal() {
    this.modalMode.set('add');
    this.classForm.reset({ courseId: this.selectedCourseId(), academicYear: '2025-2026' }); // Mặc định chọn khóa học hiện tại
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

  saveClass() {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    const formVal = this.classForm.value;
    // TODO: Gắn API C# vào đây sau
    alert(`Đã lưu lớp: ${formVal.classCode} - ${formVal.className}`);
    this.closeModal();
  }

  deleteClass(cls: any) {
    if (confirm(`Bạn có chắc muốn xóa lớp ${cls.classCode}? Toàn bộ sinh viên trong lớp sẽ bị ảnh hưởng!`)) {
      // TODO: Gắn API Delete vào đây
      this.classes.update(list => list.filter(c => c.id !== cls.id));
    }
  }
}