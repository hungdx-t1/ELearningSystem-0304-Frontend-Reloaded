// CourseDetailComponent on Student side
import { AfterViewChecked, Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService, Course, Chapter } from '../../../../core/services/course.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { ChatMessage, RealtimeChatService } from '../../../../core/services/realtime-chat.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../../v2/app/core/services/notification.service';

@Component({
  selector: 'app-course-detail-component',
  imports: [RouterLink, FormsModule],
  templateUrl: './course-detail-component.html',
  styleUrl: './course-detail-component.scss',
  animations: [
    trigger('slideInOut', [
      state('collapsed', style({ height: '0px', minHeight: '0', opacity: 0, overflow: 'hidden' })), // Trạng thái đóng: h=0
      state('expanded', style({ height: '*', opacity: 1 })), // Trạng thái mở: h tự động tính
      transition('expanded <=> collapsed', animate('300ms ease-in-out')) // Thời gian trượt 300ms
    ])
  ]
})
export class CourseDetail implements OnInit, AfterViewChecked {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);

  public authService = inject(AuthService);
  private chatService = inject(RealtimeChatService);

  private notificationService = inject(NotificationService);

  isUploadingFile = signal<boolean>(false);
  selectedFile = signal<File | null>(null);

  // Quản lý trạng thái bằng Signal
  course = signal<Course | null>(null);
  chapters = signal<Chapter[]>([]);
  isLoading = signal<boolean>(true);
  
  // chat variables
  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;
  classId = signal<string | null>(null);
  messages = signal<ChatMessage[]>([]);
  newMessage = signal<string>('');

  currentUserId = this.authService.getCurrentUserId();
  currentUserRole = this.authService.getUserRole();
  currentUserName = this.authService.userProfile()?.fullName || 'Sinh viên';

  async ngOnInit() {
    // Lấy cái ID từ trên thanh địa chỉ (ví dụ: /courses/123 -> lấy số 123)
    const courseId = this.route.snapshot.paramMap.get('id');

    // Lấy classId từ trên URL (Ví dụ: /courses/123?classId=456)
    this.route.queryParamMap.subscribe(params => {
      const cId = params.get('classId');
      if (cId) {
        this.classId.set(cId);
        this.loadChat(); // Có ID lớp thì bắt đầu lắng nghe tin nhắn
      }
    });
    
    if (courseId) {
      try {
        // 2. Kéo dữ liệu Khóa học
        const courseData = await this.courseService.getCourseById(courseId);
        this.course.set(courseData);

        // 3. Kéo danh sách Chương
        const chaptersData = await this.courseService.getChaptersByCourseId(courseId);
        
        // 4. Lấy Bài học cho từng Chương (Chạy song song cho nhanh)
        for (let chapter of chaptersData) {
          chapter.lessons = await this.courseService.getLessonsByChapterId(chapter.id);
          chapter.isExpanded = true; // Mặc định mở hết các chương ra cho đẹp
        }
        
        this.chapters.set(chaptersData);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  // chat functions
  loadChat() {
    const cId = this.classId();
    if (!cId) return;
    this.chatService.getClassMessages(cId).subscribe(msgs => {
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

  onChatFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  // course and class management functions

  // Hàm bật/tắt đóng mở Chương (Accordion)
  toggleChapter(chapter: Chapter) {
    chapter.isExpanded = !chapter.isExpanded;
    // Cập nhật lại Signal để giao diện vẽ lại
    this.chapters.set([...this.chapters()]); 
  }

  // Trả về Emoji tương ứng với loại bài học
  getLessonIcon(type: number | undefined): string {
    switch (type) {
      case 0: return '▶️';
      case 1: return '📄';
      case 2: return '📝';
      case 3: return '✍️';
      default: return '📄';
    }
  }

  // Trả về Nhãn (Badge text)
  getLessonBadge(lesson: any): string {
    switch (lesson.type) {
      case 0: return lesson.duration ? `${lesson.duration} phút` : 'Video';
      case 1: return 'Tài liệu';
      case 2: return 'Trắc nghiệm';
      case 3: return 'Tự luận';
      default: return 'Bài học';
    }
  }
}