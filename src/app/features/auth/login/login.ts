import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Tạo Form với điều kiện bắt buộc nhập
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Dùng Signal để quản lý trạng thái hiển thị lỗi và loading
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']); // <-- Trỏ thẳng đích danh vào đây
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Sai email hoặc mật khẩu. Vui lòng thử lại!');
        console.error(err);
      }
    });
  }
}