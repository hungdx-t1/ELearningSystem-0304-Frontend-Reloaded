import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SubmissionService } from '../../../core/services/submission.service';

@Component({
  selector: 'app-submission-history',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './submission-history.html'
})
export class SubmissionHistory implements OnInit {
  private submissionService = inject(SubmissionService);

  submissions = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading.set(true);
    this.submissionService.getStudentHistory().subscribe({
      next: (res) => {
        this.submissions.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.isLoading.set(false);
      }
    });
  }
}
