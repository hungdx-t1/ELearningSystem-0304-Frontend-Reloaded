import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-management',
  standalone: true,
  templateUrl: './user-management.html'
})
export class UserManagement {
  private http = inject(HttpClient);
  
  isUploading = signal<boolean>(false);

  // Hàm này chạy ngay khi người dùng chọn file xong
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    
    if (file) {
      this.isUploading.set(true);
      
      // Để gửi file qua mạng, bắt buộc phải gói nó vào FormData
      const formData = new FormData();
      formData.append('file', file);

      this.http.post<any>('http://localhost:5189/api/admin/users/import', formData).subscribe({
        next: (res) => {
          this.isUploading.set(false);
          alert(res.message); // Báo thành công
          // Tương lai: Gọi hàm load lại danh sách User ở đây
        },
        error: (err) => {
          this.isUploading.set(false);
          alert(err.error?.message || 'Có lỗi xảy ra khi tải file lên!');
        }
      });
      
      // Xóa giá trị của thẻ input file để lần sau chọn lại file đó nó vẫn nhận
      event.target.value = ''; 
    }
  }
}