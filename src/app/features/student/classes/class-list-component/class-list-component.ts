import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClassService } from '../../../../core/services/class.service';

@Component({
  selector: 'app-class-list-component',
  standalone: true,
  imports: [RouterLink], // Nhớ import RouterLink để dùng chuyển trang
  templateUrl: './class-list-component.html',
  styleUrl: './class-list-component.scss',
})
export class ClassListComponent implements OnInit {
  private classService = inject(ClassService);

  myClasses = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  // Tạm thời hardcode StudentId (Giống cái id xài bên LessonPlayer lúc nãy)
  // TODO: Sau này làm phần Auth (Đăng nhập) xong thì lấy ID từ localStorage nhé
  mockStudentId = '00000000-0000-0000-0000-000000000001';

  ngOnInit() {
    this.loadMyClasses();
  }

  loadMyClasses() {
    this.isLoading.set(true);
    this.classService.getStudentClasses(this.mockStudentId).subscribe({
      next: (data) => {
        this.myClasses.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi tải danh sách lớp:', err);
        this.isLoading.set(false);
      }
    });
  }
}