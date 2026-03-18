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

  sendMessage(message: string) {
    return this.http.post<{ reply: string }>(this.apiUrl, { prompt: message });
  }
}