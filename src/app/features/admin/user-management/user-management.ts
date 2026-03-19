import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service'; // Import Service
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, SlicePipe],
  templateUrl: './user-management.html',
})
export class UserManagement implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private userService = inject(UserService); // Tiêm UserService vào đây

  isUploading = signal<boolean>(false);
  isExporting = signal<boolean>(false);
  isLoading = signal<boolean>(true); // Thêm trạng thái loading khi tải trang

  // 1. DỮ LIỆU NGƯỜI DÙNG (Giờ khởi tạo mảng rỗng chờ API)
  users = signal<User[]>([]);

  // Vừa vào trang là gọi API lấy danh sách luôn
  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách user:', err);
        this.isLoading.set(false);
      },
    });
  }

  // 2. LOGIC TÌM KIẾM & LỌC (Giữ nguyên - Rất mượt vì chạy trên RAM Frontend)
  searchQuery = signal<string>('');
  roleFilter = signal<string>('');

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const role = this.roleFilter();

    return this.users().filter((user) => {
      const matchNameOrEmail =
        user.fullName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
      const matchRole = role ? user.role === role : true;
      return matchNameOrEmail && matchRole;
    });
  });

  // 3. LOGIC MODAL THÊM / SỬA TÀI KHOẢN
  isModalOpen = signal<boolean>(false);
  modalMode = signal<'add' | 'edit'>('add');
  selectedUserId = signal<string | null>(null);

  userForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: ['Student', Validators.required],
  });

  openAddModal() {
    this.modalMode.set('add');
    this.userForm.reset({ role: 'Student' });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  openEditModal(user: User) {
    this.modalMode.set('edit');
    this.selectedUserId.set(user.id);
    this.userForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      password: '',
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  // LƯU DATA (GỌI API THẬT)
  saveUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formVal = this.userForm.value;

    if (this.modalMode() === 'add') {
      // GỌI API THÊM MỚI
      this.userService.createUser(formVal).subscribe({
        next: () => {
          alert('Đã thêm tài khoản thành công!');
          this.loadUsers(); // Load lại bảng
          this.closeModal();
        },
        error: (err) => alert('Lỗi khi thêm tài khoản: ' + err.message),
      });
    } else {
      // GỌI API CẬP NHẬT
      const userId = this.selectedUserId();
      if (userId) {
        this.userService.updateUser(userId, formVal).subscribe({
          next: () => {
            alert('Đã cập nhật thông tin!');
            this.loadUsers(); // Load lại bảng
            this.closeModal();
          },
          error: (err) => alert('Lỗi khi cập nhật: ' + err.message),
        });
      }
    }
  }

  // 4. LOGIC KHÓA / XÓA (GỌI API THẬT)
  toggleLock(user: User) {
    const action = user.status === 'Hoạt động' ? 'khóa' : 'mở khóa';
    if (confirm(`Bạn có chắc muốn ${action} tài khoản ${user.fullName}?`)) {
      this.userService.toggleUserStatus(user.id).subscribe({
        next: () => {
          // Update local state cho mượt, khỏi cần gọi lại toàn bộ bảng
          this.users.update((list) =>
            list.map((u) =>
              u.id === user.id
                ? { ...u, status: u.status === 'Hoạt động' ? 'Khóa' : 'Hoạt động' }
                : u,
            ),
          );
        },
        error: (err) => alert('Lỗi khi đổi trạng thái: ' + err.message),
      });
    }
  }

  deleteUser(user: User) {
    if (
      confirm(
        `CẢNH BÁO: Xóa vĩnh viễn tài khoản ${user.fullName}? Toàn bộ dữ liệu của người này sẽ mất.`,
      )
    ) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          // Xóa thẳng khỏi màn hình
          this.users.update((list) => list.filter((u) => u.id !== user.id));
        },
        error: (err) => alert('Lỗi khi xóa tài khoản: ' + err.message),
      });
    }
  }

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
        },
      });

      // Xóa giá trị của thẻ input file để lần sau chọn lại file đó nó vẫn nhận
      event.target.value = '';
    }
  }

  exportExcel() {
    this.isExporting.set(true);

    // QUAN TRỌNG: Phải set responseType là 'blob' để trình duyệt hiểu đây là file (dữ liệu nhị phân)
    this.http
      .get('http://localhost:5189/api/admin/users/export', { responseType: 'blob' })
      .subscribe({
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
        },
      });
  }
}
