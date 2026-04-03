import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { RealtimeChatService, ChatMessage } from '../../../core/services/realtime-chat.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './class-detail.html',
})
export class ClassDetailComponent implements OnInit, AfterViewChecked {
  private route = inject(ActivatedRoute);
  private chatService = inject(RealtimeChatService);
  public authService = inject(AuthService); // Public để gọi trong HTML
  
  // ElementRef để nắm bắt cái khung cuộn chat
  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;

  classId = signal<string>('');
  messages = signal<ChatMessage[]>([]);
  newMessage = signal<string>('');
  
  // Lấy thông tin user hiện tại
  currentUserId = this.authService.getCurrentUserId();
  currentUserRole = this.authService.getUserRole();
  currentUserName = this.authService.userProfile()?.fullName || 'Ẩn danh';

  ngOnInit() {
    // Lấy ID lớp học từ thanh địa chỉ
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.classId.set(id);
        this.loadChat();
      }
    });
  }

  // Gọi service để lắng nghe tin nhắn từ Firebase
  loadChat() {
    this.chatService.getClassMessages(this.classId()).subscribe(msgs => {
      this.messages.set(msgs);
    });
  }

  // Hàm này tự động chạy mỗi khi giao diện vẽ xong (vd: có tin nhắn mới)
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  // Ép thanh cuộn chạy xuống dưới cùng
  scrollToBottom(): void {
    try {
      this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  // Gửi tin nhắn
  sendMessage() {
    if (!this.newMessage().trim()) return;
    
    this.chatService.sendMessage(
      this.classId(),
      this.currentUserId,
      this.currentUserName,
      this.currentUserRole,
      this.newMessage().trim()
    );
    
    this.newMessage.set(''); // Xóa trắng ô nhập sau khi gửi
  }
}