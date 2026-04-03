import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, Injector, inject, runInInjectionContext } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, orderBy, serverTimestamp, onSnapshot } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

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
  private platformId = inject(PLATFORM_ID);

  /**
   * Lắng nghe tin nhắn của một Lớp học (Real-time)
   * Bất kỳ ai nhắn tin, hàm này sẽ tự động cập nhật mảng dữ liệu mà không cần F5
   */
  getClassMessages(classId: string): Observable<ChatMessage[]> {
    // Tự tay tạo một luồng Observable để kiểm soát hoàn toàn
    return new Observable<ChatMessage[]>(observer => {
      
      // Nếu là Node.js (SSR lúc F5) thì bỏ qua, không làm gì cả
      if (!isPlatformBrowser(this.platformId)) {
        observer.next([]);
        observer.complete();
        return;
      }

      const messagesRef = collection(this.firestore, `class_chats/${classId}/messages`);
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      // Dùng onSnapshot gốc của Firebase (Bỏ qua hoàn toàn collectionData)
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          // Firebase trả về dữ liệu, ta bóc tách nó ra
          const messages = snapshot.docs.map(doc => {
            return { id: doc.id, ...doc.data() } as ChatMessage;
          });
          observer.next(messages); // Đẩy dữ liệu lên giao diện
        }, 
        (error) => {
          console.error("Lỗi lắng nghe tin nhắn Firebase:", error);
          observer.error(error);
        }
      );

      // Khi Angular hủy Component (chuyển trang), tự động ngắt kết nối Firebase để chống tràn RAM
      return () => unsubscribe();
    });
  }

  /**
   * Gửi tin nhắn mới lên Firebase
   */
  async sendMessage(classId: string, senderId: string, senderName: string, senderRole: string, content: string) {
    if (!isPlatformBrowser(this.platformId)) return null;
    
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