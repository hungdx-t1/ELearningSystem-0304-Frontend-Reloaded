import { Component, ElementRef, ViewChild, inject, signal, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../../../core/services/chat.service';
import { marked } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../../../core/services/auth.service';
import { AiChatLogService } from '../../../../core/services/aichatlog.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-chat-component.html'
})
export class AiChatComponent implements AfterViewChecked {
  private chatService = inject(ChatService);
  private sanitizer = inject(DomSanitizer);
  private aiChatLogService = inject(AiChatLogService);
  private authService = inject(AuthService);

  selectedFile = signal<File | null>(null);
  
  // Lấy cái khung cuộn màn hình từ HTML
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  chatInput = signal('');
  isTyping = signal(false); // Trạng thái AI đang suy nghĩ
  
  messages = signal<ChatMessage[]>([
    { role: 'ai', content: 'Chào bạn! Mình là trợ lý AI của hệ thống. Mình có thể giúp gì cho bạn hôm nay?' }
  ]);

  // Hàm này tự động chạy mỗi khi giao diện có thay đổi -> Dùng để cuộn xuống đáy
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) { }
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
    this.messages.update(msgs => [...msgs, { role: 'user', content: displayMsg }]);
    this.chatInput.set('');
    this.selectedFile.set(null); // Reset file sau khi gửi
    
    // 2. Bật hiệu ứng "AI đang gõ..."
    this.isTyping.set(true);

    // 3. Gọi Service truyền cả text và file
    this.chatService.sendMessage(userMsg, file).subscribe({
      next: (res) => {
        this.isTyping.set(false);
        this.messages.update(msgs => [...msgs, { role: 'ai', content: res.reply }]);

        // lưu lịch sử chat vào database (có cả câu hỏi và câu trả lời)
        const userId = this.authService.getCurrentUserId();
        if (userId) {
          const logPayload = {
            userId: userId,
            message: displayMsg, // Câu hỏi của Sinh viên (Có kèm tên file nếu có)
            response: res.reply  // Câu trả lời của AI
            // Timestamp Backend đã tự tạo bằng DateTime.UtcNow rồi nên không cần gửi
          };

          // Gọi hàm lưu chạy ngầm 
          this.aiChatLogService.saveChatLog(logPayload).subscribe({
            error: (err) => console.error("Không thể lưu lịch sử chat: ", err)
          });
        }
      },
      error: (err) => {
        this.isTyping.set(false);
        this.messages.update(msgs => [...msgs, { role: 'ai', content: 'Xin lỗi, kết nối đến não bộ AI đang bị gián đoạn.' }]);
      }
    });
  }

  formatMessage(content: string) {
    // Dùng marked để biến text có dấu ** thành thẻ <b>, \n thành <br>
    const html = marked.parse(content) as string;
    
    // Báo cho Angular biết đoạn HTML này an toàn, cứ in ra
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}