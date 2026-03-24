import { Component, ElementRef, ViewChild, inject, signal, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../../core/services/chat.service';
import { marked } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-chat-component.html'
})
export class AiChatComponent implements AfterViewChecked {
  private chatService = inject(ChatService);
  private sanitizer = inject(DomSanitizer);
  
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

  sendMessage() {
    const userMsg = this.chatInput().trim();
    if (!userMsg) return;
    
    // 1. Gắn tin nhắn user lên màn hình
    this.messages.update(msgs => [...msgs, { role: 'user', content: userMsg }]);
    this.chatInput.set('');
    
    // 2. Bật hiệu ứng "AI đang gõ..."
    this.isTyping.set(true);

    // 3. Gọi Service
    this.chatService.sendMessage(userMsg).subscribe({
      next: (res) => {
        // Tắt hiệu ứng, in câu trả lời ra
        this.isTyping.set(false);
        this.messages.update(msgs => [...msgs, { role: 'ai', content: res.reply }]);
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