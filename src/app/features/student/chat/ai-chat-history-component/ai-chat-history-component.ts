import { Component, inject, OnInit, signal, computed } from '@angular/core';
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

  sortOrder = signal<'desc' | 'asc'>('desc'); // Mặc định mới nhất lên trên

  sortedHistory = computed(() => {
    const history = [...this.chatHistory()];
    if (this.sortOrder() === 'desc') {
      return history.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    } else {
      return history.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
    }
  });

  toggleSort() {
    this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
  }

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