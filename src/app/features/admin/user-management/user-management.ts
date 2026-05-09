import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service'; // Import Service
import { SlicePipe } from '@angular/common';
import { NotificationService } from '../../../../v2/app/core/services/notification.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, SlicePipe],
  templateUrl: './user-management.html',
})
export class UserManagement implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  private notiService = inject(NotificationService);
  
  isUploading = signal<boolean>(false);
  isExporting = signal<boolean>(false);
  isLoading = signal<boolean>(true); // Thêm trạng thái loading khi tải trang

  // 1. DỮ LIỆU NGƯỜI DÙNG (Giờ khởi tạo mảng rỗng chờ API)
  users = signal<User[]>([]);

  // 2.0
  searchQuery = signal<string>('');
  roleFilter = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);

  // Vừa vào trang là gọi API lấy danh sách luôn
  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.userService.getAllUsers(this.searchQuery(), this.roleFilter(), this.currentPage(), this.pageSize()).subscribe({
      next: (response: any) => {
        const mapRoleToString = (roleValue: any) => {
          if (roleValue === 0 || roleValue === 'Admin') return 'Admin';
          if (roleValue === 1 || roleValue === 'Instructor') return 'Instructor';
          return 'Student';
        };

        // Lấy danh sách từ response.items
        const mappedUsers: User[] = response.items.map((u: any) => ({
          id: u.id,
          fullName: u.fullName || 'Chưa cập nhật',
          email: u.email || '',
          role: mapRoleToString(u.role),
          status: u.isActive === false ? 'Khóa' : 'Hoạt động'
        }));
        
        this.users.set(mappedUsers);
        this.totalItems.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.notiService.error('Lỗi tải dữ liệu!');
        this.isLoading.set(false);
      }
    });
  }

  // kích hoạt khi search hoặc filter
  onFilterChange() {
    this.currentPage.set(1); // Đưa về trang 1
    this.loadUsers();
  }

  // đổi trang
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
  }

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const role = this.roleFilter();

    return this.users().filter((user) => {
      // nếu null thì gán là chuỗi rỗng ''
      const name = (user.fullName || '').toLowerCase();
      const mail = (user.email || '').toLowerCase();
      
      const matchNameOrEmail = name.includes(query) || mail.includes(query);
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
    this.userForm.enable(); // MỞ KHÓA toàn bộ các ô khi Thêm mới
    this.userForm.reset({ role: 'Student' });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  openEditModal(user: User) {
    this.modalMode.set('edit');
    this.selectedUserId.set(user.id);
    
    // Mở khóa hết để patchValue không bị lỗi, sau đó mới khóa lại
    this.userForm.enable(); 
    
    this.userForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      password: '',
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();

    // CHỐT CHẶN: Khóa mờ ô Email và Role vì Backend DTO không cho phép sửa
    this.userForm.get('email')?.disable();
    this.userForm.get('role')?.disable();

    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.notiService.error('Form chưa hợp lệ! Vui lòng kiểm tra lại độ dài Tên hoặc định dạng Email.');
      return;
    }

    const formVal = this.userForm.getRawValue();

    // PHIÊN DỊCH ROLE: Chuyển từ Chữ (Angular) sang Số (.NET Enum)
    let roleEnumNumber = 2; // Mặc định 2 là Student
    if (formVal.role === 'Admin') roleEnumNumber = 0;
    else if (formVal.role === 'Instructor') roleEnumNumber = 1;

    if (this.modalMode() === 'add') {
      // 1. CHUẨN BỊ GÓI HÀNG CHO CREATE (Theo CreateUserRequestDto)
      
      // Chế tự động một mã UserCode (VD: STU-8492) vì DTO bắt buộc phải có
      const rolePrefix = formVal.role?.substring(0, 3).toUpperCase() || 'USR';
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const generatedUserCode = `${rolePrefix}-${randomCode}`;

      const createPayload = {
        userCode: generatedUserCode,
        fullName: formVal.fullName,
        email: formVal.email,
        password: formVal.password,
        role: roleEnumNumber, // Đã biến thành số 0, 1 hoặc 2
        administrativeClass: null // Tạm thời để null
      };

      // GỌI API THÊM MỚI
      this.userService.createUser(createPayload).subscribe({
        next: () => {
          this.notiService.success('Đã thêm tài khoản thành công!');
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => {
          let backendError = err.error?.message;
          if (!backendError && err.error?.errors) {
            // Trích xuất chuỗi lỗi đầu tiên từ object errors của .NET
            backendError = Object.values(err.error.errors).flat()[0] as string;
          }
          if (!backendError) backendError = err.message || 'Lỗi không xác định';

          this.notiService.error('Backend từ chối Thêm mới vì: ' + backendError);
        }
      });

    } else {
      // 2. CHUẨN BỊ GÓI HÀNG CHO UPDATE (Theo UpdateUserRequestDto)
      const userId = this.selectedUserId();
      
      if (userId) {
        // Tìm trạng thái hiện tại của User để giữ nguyên isActive
        const currentUser = this.users().find(u => u.id === userId);
        const currentIsActive = currentUser?.status === 'Hoạt động';

        const updatePayload = {
          fullName: formVal.fullName,
          avatarUrl: null,
          dateOfBirth: null,
          administrativeClass: null,
          isActive: currentIsActive // Gửi lại trạng thái cũ
          // DTO không cho phép sửa Email và Role nên ta không gửi lên
        };

        // GỌI API CẬP NHẬT
        this.userService.updateUser(userId, updatePayload).subscribe({
          next: () => {
            this.notiService.success('Đã cập nhật thông tin thành công!');
            this.loadUsers();
            this.closeModal();
          },
          error: (err) => {
            const backendError = err.error?.message || JSON.stringify(err.error?.errors) || err.message;
            this.notiService.error('Backend từ chối Cập nhật vì: ' + backendError);
          }
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
        error: (err) => this.notiService.error('Lỗi khi đổi trạng thái: ' + err.message),
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
        error: (err) => this.notiService.error('Lỗi khi xóa tài khoản: ' + err.message),
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

      this.http.post<any>(`${environment.apiUrl}/admin/users/import`, formData).subscribe({
        next: (res) => {
          this.isUploading.set(false);
          this.notiService.success(res.message); // Báo thành công
          // Tương lai: Gọi hàm load lại danh sách User ở đây
        },
        error: (err) => {
          this.isUploading.set(false);
          this.notiService.error(err.error?.message || 'Có lỗi xảy ra khi tải file lên!');
        },
      });

      // Xóa giá trị của thẻ input file để lần sau chọn lại file đó nó vẫn nhận
      event.target.value = '';
    }
  }

  exportExcel() {
    this.isExporting.set(true);

    // set responseType là 'blob' để trình duyệt hiểu đây là file (dữ liệu nhị phân)
    this.http
      .get(`${environment.apiUrl}/admin/users/export`, { responseType: 'blob' })
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
          this.notiService.error('Có lỗi xảy ra khi tải file Excel!');
          this.isExporting.set(false);
        },
      });
  }
}
