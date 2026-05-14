import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
  AfterViewChecked,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../../../core/services/auth.service';
import { AiChatLogService } from '../../../../core/services/aichatlog.service';
import { RouterLink } from '@angular/router';
import { AiService, ChatMessage } from '../../../../core/services/ai.service';
import { CourseService } from '../../../../core/services/course.service';
import { ClassService } from '../../../../core/services/class.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './ai-chat-component.html',
})
export class AiChatComponent implements AfterViewChecked {
  private sanitizer = inject(DomSanitizer);
  private aiChatLogService = inject(AiChatLogService);
  private authService = inject(AuthService);
  private aiService = inject(AiService);
  private courseService = inject(CourseService);
  private classService = inject(ClassService);

  selectedFile = signal<File | null>(null);
  selectedLessonIds = signal<string[]>([]);

  // RAG
  isDocModalOpen = signal(false);
  availableCourses = signal<any[]>([]); // Lưu toàn bộ cây: Khóa -> Chương -> Bài học

  totalSelectedFiles = computed(() => {
    const uploadedFileCount = this.selectedFile() ? 1 : 0;
    const systemFileCount = this.selectedLessonIds().length;
    return uploadedFileCount + systemFileCount;
  });

  // Lấy cái khung cuộn màn hình từ HTML
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  chatInput = signal('');
  isTyping = signal(false); // Trạng thái AI đang suy nghĩ

  messages = signal<ChatMessage[]>([
    {
      role: 'ai',
      content: 'Chào bạn! Mình là trợ lý AI của hệ thống. Mình có thể giúp gì cho bạn hôm nay?',
    },
  ]);

  // Hàm này tự động chạy mỗi khi giao diện có thay đổi -> Dùng để cuộn xuống đáy
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  sendMessage() {
    const userMsg = this.chatInput().trim();
    const file = this.selectedFile();

    if (!userMsg) return;

    // Gắn nhãn file vào tin nhắn để hiển thị lên UI cho đẹp
    let displayMsg = userMsg;
    if (file) {
      displayMsg += `\n\n*(Đính kèm tài liệu: 📎 ${file.name})*`;
    }

    // 1. Gắn tin nhắn user lên màn hình
    this.messages.update((msgs) => [...msgs, { role: 'user', content: displayMsg }]);
    this.chatInput.set('');
    this.selectedFile.set(null); // Reset file sau khi gửi

    // 2. Bật hiệu ứng "AI đang gõ..."
    this.isTyping.set(true);

    // 3. Gọi Service truyền cả text và file
    this.aiService.sendMessage(userMsg, this.selectedLessonIds(), file).subscribe({
      next: (res) => {
        this.isTyping.set(false);
        this.messages.update((msgs) => [...msgs, { role: 'ai', content: res.reply }]);

        // lưu lịch sử chat vào database (có cả câu hỏi và câu trả lời)
        const userId = this.authService.getCurrentUserId();
        if (userId) {
          const logPayload = {
            userId: userId,
            message: displayMsg, // Câu hỏi của Sinh viên (Có kèm tên file nếu có)
            response: res.reply, // Câu trả lời của AI
            // Timestamp Backend đã tự tạo bằng DateTime.UtcNow rồi nên không cần gửi
          };

          // Gọi hàm lưu chạy ngầm
          this.aiChatLogService.saveChatLog(logPayload).subscribe({
            error: (err) => console.error('Không thể lưu lịch sử chat: ', err),
          });
        }
      },
      error: (err) => {
        this.isTyping.set(false);
        this.messages.update((msgs) => [
          ...msgs,
          { role: 'ai', content: 'Xin lỗi, kết nối đến não bộ AI đang bị gián đoạn.' },
        ]);
      },
    });
  }

  formatMessage(content: string) {
    // Dùng marked để biến text có dấu ** thành thẻ <b>, \n thành <br>
    const html = marked.parse(content) as string;

    // Báo cho Angular biết đoạn HTML này an toàn, cứ in ra
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Hàm mở Modal và tải cấu trúc tài liệu của các khóa học ĐÃ GHI DANH
  async openDocumentModal() {
    this.isDocModalOpen.set(true);

    // Nếu đã tải rồi thì không tải lại cho nhẹ máy
    if (this.availableCourses().length > 0) return;

    try {
      const userId = this.authService.getCurrentUserId();
      if (!userId) return;

      // 1. Lấy danh sách các lớp sinh viên đang học
      const myClasses = (await this.classService.getStudentClasses(userId).toPromise()) || [];

      // 2. Lọc ra các ID khóa học (courseId) duy nhất (tránh 1 môn có nhiều lớp bị trùng)
      const uniqueCourseIds = [...new Set(myClasses.map((c) => c.courseId))];

      const coursesWithDocs = [];

      // 3. Lặp qua các khóa học đã ghi danh để lấy Chương và Bài học
      for (let cId of uniqueCourseIds) {
        // Lấy thông tin chi tiết Khóa học
        const course = await this.courseService.getCourseById(cId);
        if (!course) continue;

        const chapters = await this.courseService.getChaptersByCourseId(course.id);
        let hasAnyDocument = false;

        for (let chapter of chapters) {
          const lessons = await this.courseService.getLessonsByChapterId(chapter.id);
          // Chỉ lọc ra các bài học dạng Document (type === 1) có chứa link
          chapter.lessons = lessons.filter((l) => l.type === 1 && l.documentUrl);

          if (chapter.lessons.length > 0) {
            hasAnyDocument = true;
          }
        }

        // Nếu khóa học này có chứa tài liệu thì mới đưa vào danh sách hiển thị
        if (hasAnyDocument) {
          coursesWithDocs.push({
            ...course,
            chapters: chapters.filter((c) => c.lessons && c.lessons.length > 0),
          });
        }
      }

      this.availableCourses.set(coursesWithDocs);
    } catch (err) {
      console.error('Lỗi khi tải danh sách tài liệu', err);
    }
  }

  toggleLessonSelection(lessonId: string) {
    const currentList = this.selectedLessonIds();
    if (currentList.includes(lessonId)) {
      this.selectedLessonIds.set(currentList.filter((id) => id !== lessonId));
    } else {
      this.selectedLessonIds.set([...currentList, lessonId]);
    }
  }
}
