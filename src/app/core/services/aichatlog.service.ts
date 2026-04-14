import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiChatLog {
  id?: string;
  userId?: string;
  message: string;
  response: string;
  timestamp?: string; // lưu trữ dưới dạng chuỗi ISO 8601
}

@Injectable({
  providedIn: 'root'
})
export class AiChatLogService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5189/api/aichatlogs'; 

  // api lưu lịch sử tương tác AI
  saveChatLog(log: AiChatLog): Observable<any> {
    return this.http.post(this.apiUrl, log); // Đã sửa lại đường dẫn theo C# Controller
  }

  getHistory(userId: string): Observable<AiChatLog[]> {
    return this.http.get<AiChatLog[]>(`${this.apiUrl}/user/${userId}`);
  }
}