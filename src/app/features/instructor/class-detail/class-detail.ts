import { Component, inject, signal, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClassService } from '../../../core/services/class.service';
import { UserService, User } from '../../../core/services/user.service';
import { DatePipe, SlicePipe } from '@angular/common';
import { NotificationService } from '../../../../v2/app/core/services/notification.service';
import { ChatMessage, RealtimeChatService } from '../../../core/services/realtime-chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-instructor-class-detail',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterModule, SlicePipe, DatePipe],
  templateUrl: './class-detail.html'
})
export class InstructorClassDetail implements OnInit, AfterViewChecked {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  private classService = inject(ClassService);
  private userService = inject(UserService);
  private notiService = inject(NotificationService);

  public authService = inject(AuthService);
  private chatService = inject(RealtimeChatService);

  private courseService = inject(CourseService); // xài ké cái tính năng upload file

  // tiêm nốt cái NotificationService
  private notificationService = inject(NotificationService);

  isUploadingFile = signal<boolean>(false);
  selectedFile = signal<File | null>(null);

  classId = signal<string>('');
  classInfo = signal<any>(null);
  
  students = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  isAddModalOpen = signal<boolean>(false);
  addStudentForm = this.fb.group({
    emailOrCode: ['', Validators.required]
  });

  isImporting = signal<boolean>(false);

  // Chat variables
  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;
  messages = signal<ChatMessage[]>([]);
  newMessage = signal<string>('');
  
  currentUserId = this.authService.getCurrentUserId();
  currentUserRole = this.authService.getUserRole();
  currentUserName = this.authService.userProfile()?.fullName || 'Giảng viên';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.classId.set(id);
      this.loadClassData(id);
      this.loadChat();
    } else {
      this.router.navigate(['/instructor/classes']);
    }
  }

  // quản lý sinh viên trong lớp
  loadClassData(id: string) {
    this.isLoading.set(true);
    this.classService.getClassDetails(id).subscribe({
      next: (data) => {
        // bảo mật
        const currentUserId = this.authService.getCurrentUserId();
        const currentUserRole = this.authService.getUserRole();

        // Kiểm tra: Nếu không phải Admin VÀ Giảng viên của lớp khác với người đang đăng nhập
        if (currentUserRole !== 'Admin' && data.instructorId && data.instructorId !== currentUserId) {
          this.notiService.error('Cảnh báo: Bạn không có quyền quản lý lớp học này!');
          this.router.navigate(['/no-permission']);
          return;
        }

        // Tách data thành classInfo và danh sách students
        this.classInfo.set({
          id: data.id,
          classCode: data.classCode,
          className: data.className,
          courseName: data.courseName,
          googleMeetLink: data.googleMeetLink,
          academicYear: data.academicYear
        });
        this.students.set(data.students);
        this.isLoading.set(false);
      },
      error: (err) => {
        if (err.status === 403) {
          this.notiService.error('Bạn không có quyền truy cập dữ liệu này!');
          this.router.navigate(['/no-permission']);
        } else {
          this.notiService.error('Lỗi tải thông tin lớp: ' + (err.error?.message || err.message));
        }
        this.isLoading.set(false);
      }
    });
  }

  copyMeetLink() {
    const link = this.classInfo()?.googleMeetLink;
    if (link) {
      navigator.clipboard.writeText(link);
      this.notiService.success('Đã copy link Google Meet!');
    }
  }

  openAddModal() {
    this.addStudentForm.reset();
    this.isAddModalOpen.set(true);
  }

  // thêm sv mới bằng tay
  saveStudent() {
    if (this.addStudentForm.invalid) return;
    const emailOrCode = this.addStudentForm.value.emailOrCode!;
    
    // Cần gọi API tìm userId trước (hoặc nhờ BE C# viết 1 API EnrollByEmail cho lẹ)
    // Tạm thời mình dùng API lấy tất cả user rồi filter bên Frontend cho nhanh
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        const student = users.find(u => u.email === emailOrCode || u.fullName.includes(emailOrCode)); // Note: Chỗ u.UserCode tùy thuộc DTO của bạn
        
        if (!student) {
          this.notiService.error('Không tìm thấy Sinh viên này trong hệ thống!');
          return;
        }

        // Tìm thấy ID rồi thì đẩy vô Lớp
        this.classService.enrollStudent(this.classId(), student.id).subscribe({
          next: () => {
            this.notiService.success(`Đã thêm thành công!`);
            this.loadClassData(this.classId()); // Tải lại danh sách
            this.isAddModalOpen.set(false);
          },
          error: (err) => this.notiService.error('Lỗi: ' + (err.error?.message || err.message))
        });
      }
    });
  }

  // đuổi học sv
  removeStudent(studentId: string, name: string) {
    if (confirm(`Xóa sinh viên ${name} khỏi lớp sẽ mất toàn bộ điểm số. Bạn chắc chứ?`)) {
      this.classService.removeStudent(this.classId(), studentId).subscribe({
        next: () => {
          this.students.update(list => list.filter(s => s.id !== studentId)); // Xóa trên giao diện
        },
        error: (err) => this.notiService.error('Lỗi xóa: ' + err.message)
      });
    }
  }

  // upload excel để thêm nhiều sv
  onExcelImport(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isImporting.set(true);

    this.classService.importStudentsExcel(this.classId(), file).subscribe({
      next: (response) => {
        this.isImporting.set(false);
        input.value = ''; // Reset
        
        // Hiện thông báo + lỗi nếu có
        let msg = response.message;
        if (response.errors && response.errors.length > 0) {
          msg += '\n\nTuy nhiên có vài lỗi sau:\n' + response.errors.join('\n');
        }
        this.notiService.success(msg);
        
        this.loadClassData(this.classId()); // Tải lại bảng để thấy sinh viên mới
      },
      error: (err) => {
        this.notiService.error('Lỗi Import: ' + (err.error?.message || err.message));
        this.isImporting.set(false);
        input.value = '';
      }
    });
  }

  // Chat functions
  loadChat() {
    this.chatService.getClassMessages(this.classId()).subscribe(msgs => {
      this.messages.set(msgs);
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  sendMessage() {
    const cId = this.classId();
    if ((!this.newMessage().trim() && !this.selectedFile()) || !cId) return;

    const fileToUpload = this.selectedFile();
    const messageText = this.newMessage().trim();

    // Reset UI ngay lập tức để người dùng thấy mượt
    this.newMessage.set('');
    this.selectedFile.set(null);

    if (fileToUpload) {
      this.isUploadingFile.set(true);
      // Gọi API C# upload lên Cloudinary
      this.courseService.uploadFile(fileToUpload).subscribe({
        next: (res) => {
          this.chatService.sendMessage(cId, this.currentUserId, this.currentUserName, this.currentUserRole, messageText, res.url, fileToUpload.name);
          this.isUploadingFile.set(false);
        },
        error: () => {
          this.notificationService.error('Lỗi upload file!');
          this.isUploadingFile.set(false);
        }
      });
    } else {
      // Gửi tin nhắn text bình thường
      this.chatService.sendMessage(cId, this.currentUserId, this.currentUserName, this.currentUserRole, messageText);
    }
  }

  onChatFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  reactToMessage(msgId: string, reaction: string, currentReactions: any) {
    const cId = this.classId();
    if (cId) {
      this.chatService.toggleReaction(cId, msgId, this.currentUserId, reaction, currentReactions);
    }
  }

  getReactionSummary(reactions: any = {}) {
    const summary: any = {};
    Object.values(reactions).forEach((val: any) => {
      summary[val] = (summary[val] || 0) + 1;
    });
    // Trả về dạng mảng: [ {icon: '❤️', count: 2}, {icon: '👍', count: 1} ]
    return Object.keys(summary).map(key => ({ icon: key, count: summary[key] }));
  }
}