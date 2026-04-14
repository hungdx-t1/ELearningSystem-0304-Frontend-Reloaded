import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AiChatLog, AiChatLogService } from '../../../../core/services/aichatlog.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-ai-chat-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-chat-history-component.html',
})
export class AiChatHistoryComponent implements OnInit {
  private aiChatLogService = inject(AiChatLogService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  chatHistory = signal<AiChatLog[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.errorMessage.set('Không thể xác thực người dùng.');
      this.isLoading.set(false);
      return;
    }

    this.aiChatLogService.getHistory(userId).subscribe({
      next: (history) => {
        this.chatHistory.set(history);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi khi tải lịch sử trò chuyện:', err);
        this.errorMessage.set('Có lỗi xảy ra khi tải lịch sử.');
        this.isLoading.set(false);
      },
    });
  }

  formatMessage(content: string): SafeHtml {
    if (!content) return '';
    const html = marked.parse(content) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}