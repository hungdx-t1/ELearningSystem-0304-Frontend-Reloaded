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
  isExporting = signal<boolean>(false);

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

  exportExcel() {
    this.isExporting.set(true);
    
    // QUAN TRỌNG: Phải set responseType là 'blob' để trình duyệt hiểu đây là file (dữ liệu nhị phân)
    this.http.get('http://localhost:5189/api/admin/users/export', { responseType: 'blob' }).subscribe({
      next: (blob) => {
        // Tạo một đường link ảo
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Đặt tên file tải về
        a.download = `DanhSachNguoiDung_${new Date().getTime()}.xlsx`; 
        
        // Gắn link vào body, tự động click để tải, rồi xóa nó đi
        document.body.appendChild(a);
        a.click();
        
        // Dọn dẹp bộ nhớ
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.isExporting.set(false);
      },
      error: (err) => {
        console.error(err);
        alert('Có lỗi xảy ra khi tải file Excel!');
        this.isExporting.set(false);
      }
    });
  }
}