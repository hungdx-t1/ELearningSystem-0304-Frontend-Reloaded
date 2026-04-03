import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, orderBy, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: string; // Để tô màu phân biệt Giảng viên và Sinh viên
  content: string;
  timestamp: any;     // Thời gian thực từ server Firebase
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeChatService {
  private firestore = inject(Firestore);

  /**
   * Lắng nghe tin nhắn của một Lớp học (Real-time)
   * Bất kỳ ai nhắn tin, hàm này sẽ tự động cập nhật mảng dữ liệu mà không cần F5
   */
  getClassMessages(classId: string): Observable<ChatMessage[]> {
    // Trỏ tới đúng folder tin nhắn của lớp đó trên Firebase
    const messagesRef = collection(this.firestore, `class_chats/${classId}/messages`);
    
    // Sắp xếp tin nhắn theo TG (cũ nhất ở trên, mới nhất ở dưới)
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    // Trả về luồng dữ liệu (Kèm theo cái ID của document)
    return collectionData(q, { idField: 'id' }) as Observable<ChatMessage[]>;
  }

  /**
   * Gửi tin nhắn mới lên Firebase
   */
  async sendMessage(classId: string, senderId: string, senderName: string, senderRole: string, content: string) {
    const messagesRef = collection(this.firestore, `class_chats/${classId}/messages`);
    
    // Đẩy dữ liệu lên Firebase. serverTimestamp() giúp đồng bộ thời gian chuẩn xác nhất.
    return addDoc(messagesRef, {
      senderId,
      senderName,
      senderRole,
      content,
      timestamp: serverTimestamp()
    });
  }
}