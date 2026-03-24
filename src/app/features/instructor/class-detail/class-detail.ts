import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClassService } from '../../../core/services/class.service';
import { UserService } from '../../../core/services/user.service';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-instructor-class-detail',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterModule, SlicePipe],
  templateUrl: './class-detail.html'
})
export class InstructorClassDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  private classService = inject(ClassService);
  private userService = inject(UserService);

  classId = signal<string>('');
  classInfo = signal<any>(null);
  
  // Danh sách sinh viên trong lớp
  students = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  // Quản lý Modal thêm 1 sinh viên
  isAddModalOpen = signal<boolean>(false);
  addStudentForm = this.fb.group({
    emailOrCode: ['', Validators.required]
  });

  // Trạng thái Import Excel
  isImporting = signal<boolean>(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.classId.set(id);
      this.loadClassData(id);
    } else {
      this.router.navigate(['/instructor/classes']);
    }
  }

  loadClassData(id: string) {
    this.isLoading.set(true);
    
    // Tạm thời dùng setTimeout giả lập API
    setTimeout(() => {
      this.classInfo.set({
        id: id,
        classCode: 'L01-C#',
        className: 'Lập trình C# Cơ bản',
        courseName: 'Khóa học C# .NET Core',
        googleMeetLink: 'https://meet.google.com/abc-xyz-def',
        academicYear: '2025-2026'
      });

      this.students.set([
        { id: 'sv1', fullName: 'Nguyễn Văn A', email: 'nva@school.edu.vn', studentCode: 'SV001', joinDate: '2026-03-20' },
        { id: 'sv2', fullName: 'Trần Thị B', email: 'ttb@school.edu.vn', studentCode: 'SV002', joinDate: '2026-03-22' }
      ]);
      
      this.isLoading.set(false);
    }, 500);
  }

  // --- XỬ LÝ COPY LINK MEET ---
  copyMeetLink() {
    const link = this.classInfo()?.googleMeetLink;
    if (link) {
      navigator.clipboard.writeText(link);
      alert('Đã copy link Google Meet!');
    }
  }

  // --- XỬ LÝ THÊM 1 SINH VIÊN ---
  openAddModal() {
    this.addStudentForm.reset();
    this.isAddModalOpen.set(true);
  }

  saveStudent() {
    if (this.addStudentForm.invalid) return;
    
    const emailOrCode = this.addStudentForm.value.emailOrCode;
    // TODO: Gọi API C# -> Tìm SV theo Email/Code -> Thêm vào bảng ClassEnrollment
    console.log(`Đang thêm SV: ${emailOrCode} vào lớp ${this.classId()}`);
    
    alert(`Đã gửi yêu cầu thêm sinh viên ${emailOrCode}!`);
    this.isAddModalOpen.set(false);
    // this.loadClassData(this.classId()); // Tải lại danh sách
  }

  removeStudent(studentId: string, name: string) {
    if (confirm(`Bạn có chắc muốn xóa sinh viên ${name} khỏi lớp không? Toàn bộ điểm số của sinh viên này trong lớp sẽ bị mất!`)) {
      // TODO: Gọi API xóa khỏi ClassEnrollment
      this.students.update(list => list.filter(s => s.id !== studentId));
      alert('Đã xóa sinh viên khỏi lớp.');
    }
  }

  // --- XỬ LÝ IMPORT EXCEL ---
  onExcelImport(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isImporting.set(true);

    // TODO: Gửi file Excel này xuống API C# để C# đọc và insert hàng loạt vào DB
    console.log('Đang upload file Excel:', file.name);
    
    setTimeout(() => {
      alert('Đã import thành công danh sách sinh viên từ Excel!');
      this.isImporting.set(false);
      input.value = ''; // Reset thẻ input
    }, 1500);
  }
}