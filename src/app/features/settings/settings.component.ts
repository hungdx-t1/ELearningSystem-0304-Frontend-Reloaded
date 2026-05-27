import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../../v2/app/core/services/notification.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notiService = inject(NotificationService);

  passwordForm: FormGroup;
  otpForm: FormGroup;

  isRequestingOtp = false;
  isConfirmingOtp = false;
  showOtpStep = false;

  constructor() {
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmNewPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.otpForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  // Validator kiểm tra 2 mật khẩu mới có khớp nhau không
  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmNewPassword')?.value
      ? null : { 'mismatch': true };
  }

  onRequestChangePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isRequestingOtp = true;
    const oldPassword = this.passwordForm.value.oldPassword;

    this.authService.requestChangePassword(oldPassword).subscribe({
      next: (res: any) => {
        this.notiService.success(res?.message || 'Mã OTP đã được gửi đến email của bạn.');
        this.showOtpStep = true;
        this.isRequestingOtp = false;
      },
      error: (err: any) => {
        let msg = 'Mật khẩu cũ không chính xác hoặc có lỗi xảy ra.';
        if (err?.status === 400 && err.error?.errors) {
           msg = Object.values(err.error.errors).flat().join('\n');
        } else if (err?.error?.message) {
           msg = err.error.message;
        }
        this.notiService.error(msg);
        this.isRequestingOtp = false;
      }
    });
  }

  onConfirmChangePassword() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isConfirmingOtp = true;
    const newPassword = this.passwordForm.value.newPassword;
    const otpCode = this.otpForm.value.otpCode;

    this.authService.confirmChangePassword(newPassword, otpCode).subscribe({
      next: (res: any) => {
        this.notiService.success(res?.message || 'Đổi mật khẩu thành công.');
        this.resetFlow();
      },
      error: (err: any) => {
        let msg = 'Mã OTP không chính xác hoặc đã hết hạn!';
        if (err?.status === 400 && err.error?.errors) {
           msg = Object.values(err.error.errors).flat().join('\n');
        } else if (err?.error?.message) {
           msg = err.error.message;
        }
        this.notiService.error(msg);
        this.isConfirmingOtp = false;
      }
    });
  }

  resetFlow() {
    this.passwordForm.reset();
    this.otpForm.reset();
    this.showOtpStep = false;
    this.isRequestingOtp = false;
    this.isConfirmingOtp = false;
  }
}
