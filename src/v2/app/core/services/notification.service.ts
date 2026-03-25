import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Signal chứa danh sách các thông báo đang hiển thị
  toasts = signal<Toast[]>([]);

  // Hàm hiển thị chung
  show(type: 'success' | 'error' | 'warning' | 'info', message: string, duration = 3000) {
    const id = Math.random().toString(36).substring(2, 9); // create a random id for the toast
    
    // Thêm thông báo mới vào danh sách
    this.toasts.update(currentToasts => [...currentToasts, { id, type, message }]);

    // Tự động tắt sau X giây
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  // Các hàm viết tắt cho tiện dụng
  success(message: string, duration = 3000) {
    this.show('success', message, duration);
  }

  error(message: string, duration = 4000) {
    this.show('error', message, duration); // Lỗi thì để lâu hơn 1 xíu cho người ta kịp đọc
  }

  warning(message: string, duration = 3000) {
    this.show('warning', message, duration);
  }

  info(message: string, duration = 3000) {
    this.show('info', message, duration);
  }

  // Xóa thông báo (khi hết giờ hoặc người dùng tự bấm X)
  remove(id: string) {
    this.toasts.update(currentToasts => currentToasts.filter(t => t.id !== id));
  }
}