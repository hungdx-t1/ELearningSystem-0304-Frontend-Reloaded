import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClassService } from '../../../../core/services/class.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-class-list-component',
  standalone: true,
  imports: [RouterLink], // Nhớ import RouterLink để dùng chuyển trang
  templateUrl: './class-list-component.html',
  styleUrl: './class-list-component.scss',
})
export class ClassListComponent implements OnInit {
  private classService = inject(ClassService);
  private authService = inject(AuthService);

  myClasses = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.loadMyClasses();
  }

  loadMyClasses() {
    this.isLoading.set(true);

    const realStudentId = this.authService.getCurrentUserId(); 

    this.classService.getStudentClasses(realStudentId).subscribe({
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