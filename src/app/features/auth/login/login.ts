import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../v2/app/core/services/notification.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login { // LoginComponent
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  private notiService = inject(NotificationService);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  // Signal quản lý trạng thái hiển thị lỗi, thành công và chế độ View
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  viewMode = signal<'LOGIN' | 'FORGOT_PASS' | 'VERIFY_OTP' | 'RESET_PASS'>('LOGIN');

  // Lưu tạm thông tin khi chạy OTP Flow
  resetEmail = '';
  resetToken = '';

  forgotPassForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  verifyOtpForm = this.fb.nonNullable.group({
    otpCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  resetPassForm = this.fb.nonNullable.group({
    newPassword: ['', [
      Validators.required, 
      Validators.minLength(8), 
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    ]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    const newPass = g.get('newPassword')?.value;
    const confirmPass = g.get('confirmPassword')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }

  // Chuyển đổi giao diện Đăng nhập / Quên mật khẩu
  switchMode(mode: 'LOGIN' | 'FORGOT_PASS') {
    this.viewMode.set(mode);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.forgotPassForm.reset();
    this.verifyOtpForm.reset();
    this.resetPassForm.reset();
  }

  // --- API Handlers ---

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.isLoading.set(false);

        const user = this.authService.userProfile();
        if (user && user.isActive === false) {
          this.authService.logout(); // Xóa sạch dữ liệu vừa lưu
          this.errorMessage.set('Tài khoản của bạn đã bị khóa, vui lòng liên hệ Ban quản trị.');
          return;
        }

        const role = this.authService.getUserRole();

        if (role === 'Admin') {
          this.router.navigate(['/admin/dashboard']); 
        } else if (role === 'Instructor') {
          this.router.navigate(['/instructor/courses']); 
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Sai email hoặc mật khẩu. Vui lòng thử lại!');
        console.error(err);
      }
    });
  }

  onForgotPassSubmit() {
    if (this.forgotPassForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const email = this.forgotPassForm.getRawValue().email;
    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.resetEmail = email;
        this.viewMode.set('VERIFY_OTP');
        this.successMessage.set('Nếu email hợp lệ, một mã OTP đã được gửi đến hộp thư của bạn.');
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 400 && err.error?.errors) {
          // Lỗi validation từ Backend (ví dụ sai domain email)
          const errorMsg = Object.values(err.error.errors).flat().join('\n');
          this.errorMessage.set(errorMsg);
        } else if (err.status === 400) {
          this.errorMessage.set(err.error?.message || 'Yêu cầu không hợp lệ.');
        } else {
          // Lỗi khác hoặc 500, có thể do email ko tồn tại (nhưng backend trả 200 cho email ko tồn tại rồi)
          this.errorMessage.set('Có lỗi xảy ra khi gửi email khôi phục.');
        }
      }
    });
  }

  onVerifyOtpSubmit() {
    if (this.verifyOtpForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const otpCode = this.verifyOtpForm.getRawValue().otpCode;
    this.authService.verifyOtp(this.resetEmail, otpCode).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.resetToken = res.resetToken;
        this.viewMode.set('RESET_PASS');
        this.successMessage.set('Xác minh thành công. Mời bạn đặt mật khẩu mới.');
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Mã OTP không chính xác hoặc đã hết hạn.');
      }
    });
  }

  onResetPassSubmit() {
    if (this.resetPassForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');

    const np = this.resetPassForm.getRawValue().newPassword;
    this.authService.resetPassword(this.resetToken, np).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.switchMode('LOGIN');
        this.successMessage.set('Đổi mật khẩu thành công! Giờ bạn có thể đăng nhập.');
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 400 && err.error?.errors) {
           const errorMsg = Object.values(err.error.errors).flat().join('\n');
           this.errorMessage.set(errorMsg);
        } else {
           this.errorMessage.set(err.error?.message || 'Yêu cầu đổi mật khẩu không hợp lệ hoặc đã hết hạn.');
           this.switchMode('LOGIN');
        }
      }
    });
  }
}