import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ClassService } from '../../../core/services/class.service';
import { CourseService } from '../../../core/services/course.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-admin-class-management',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './class-management.html'
})
export class AdminClassManagement implements OnInit {
  private fb = inject(FormBuilder);

  private classService = inject(ClassService);
  private courseService = inject(CourseService);
  private userService = inject(UserService);
  
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
    this.loadAllData();
  }

  loadAllData() {
    // Kéo danh sách Lớp học
    this.classService.getAllClasses().subscribe({
      next: (data) => this.classes.set(data)
    });

    // Kéo danh sách Khóa học (để thả vào dropdown chọn môn)
    this.courseService.getAllCourses().subscribe({
      next: (data) => this.courses.set(data)
    });

    // Kéo danh sách User, nhưng chỉ lọc lấy Giảng viên (Role = 1 hoặc 'Instructor')
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        // const instList = users.filter(u => u.role === 1 || u.role === 'Instructor');
        const instList = users.filter(u => u.role.toLowerCase() === 'instructor' || u.role === 'admin'); // Admin cũng có thể được chọn làm GV
        this.instructors.set(instList);
      }
    });
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

    const payload = this.classForm.value;

    if (this.modalMode() === 'add') {
      this.classService.createClass(payload).subscribe({
        next: () => {
          alert('Đã tạo lớp và phân công Giảng viên!');
          this.loadAllData(); // Tải lại bảng sau khi lưu
          this.closeModal();
        },
        error: (err) => alert('Lỗi: ' + (err.error?.message || err.message))
      });
    } else {
      // Gọi hàm updateClass() ở đây nếu đang Edit
    }
  }

  deleteClass(cls: any) { /* Logic xóa */ }
}