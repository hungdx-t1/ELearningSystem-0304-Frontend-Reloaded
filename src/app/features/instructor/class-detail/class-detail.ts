import { Component, inject, signal, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClassService } from '../../../core/services/class.service';
import { UserService, User } from '../../../core/services/user.service';
import { DatePipe, SlicePipe } from '@angular/common';
import { NotificationService } from '../../../../v2/app/core/services/notification.service';
import { ChatMessage, RealtimeChatService } from '../../../core/services/realtime-chat.service';
import { AuthService } from '../../../core/services/auth.service';

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
        this.notiService.error('Lỗi tải thông tin lớp: ' + err.message);
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
    if (!this.newMessage().trim()) return;
    
    this.chatService.sendMessage(
      this.classId(),
      this.currentUserId,
      this.currentUserName,
      this.currentUserRole,
      this.newMessage().trim()
    );
    
    this.newMessage.set(''); 
  }
}