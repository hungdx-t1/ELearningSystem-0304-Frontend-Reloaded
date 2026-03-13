import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ai-chat-component',
  templateUrl: './ai-chat-component.html',
  styleUrl: './ai-chat-component.scss',
  imports: [FormsModule],
})
export class AiChatComponent {
  chatInput = signal('');

  // Dữ liệu giả lập 2 tin nhắn đầu tiên
  messages = signal([
    {
      role: 'ai',
      content: 'Chào bạn! Mình là trợ lý AI của hệ thống LMS. Mình có thể giúp gì cho bạn hôm nay?',
    },
    { role: 'user', content: 'Giới thiệu sơ qua về môn học Kiến trúc phần mềm đi.' },
  ]);

  sendMessage() {
    if (!this.chatInput().trim()) return;

    // 1. Nhét tin nhắn của người dùng vào mảng
    this.messages.update((msgs) => [...msgs, { role: 'user', content: this.chatInput() }]);

    // 2. Xóa trắng ô nhập liệu
    this.chatInput.set('');

    // 3. (Tương lai sẽ gọi API ở đây để AI trả lời)
  }
}
