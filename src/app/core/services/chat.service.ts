import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, of } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5189/api/ai/chat';

  // Hàm gửi tin nhắn (Tạm thời dùng RxJS 'of' và 'delay' để giả lập AI đang suy nghĩ mất 1.5s)
  sendMessage(message: string) {
    // TODO: Tương lai sẽ mở comment dòng dưới này ra để gọi API thật
    // return this.http.post<{ reply: string }>(this.apiUrl, { prompt: message });
    
    // Logic giả lập:
    const mockReply = `AI đã nhận được câu hỏi: "${message}". Tính năng gọi API thật sẽ sớm được kết nối!`;
    return of({ reply: mockReply }).pipe(delay(1500)); 
  }
}