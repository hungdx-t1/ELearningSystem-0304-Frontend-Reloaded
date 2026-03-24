import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-assignment-grading',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './assignment-grading.html'
})
export class AssignmentGrading implements OnInit {
  private fb = inject(FormBuilder);

  // Giả lập dữ liệu bài nộp của Sinh viên (Sau này gọi API kéo về)
  submissions = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  // Quản lý Modal chấm bài
  isGradingModalOpen = signal<boolean>(false);
  selectedSubmission = signal<any>(null);

  gradingForm = this.fb.group({
    score: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
    feedback: ['', Validators.required]
  });

  ngOnInit() {
    this.loadSubmissions();
  }

  loadSubmissions() {
    this.isLoading.set(true);
    // MOCK DATA: Giả lập danh sách sinh viên nộp bài
    setTimeout(() => {
      this.submissions.set([
        { id: '1', studentName: 'Nguyễn Văn A', studentCode: 'SV001', submittedAt: new Date().toISOString(), content: 'Em gửi thầy link Github đồ án ạ: github.com/...', fileUrl: 'https://cloudinary...', status: 'Pending', score: null, feedback: null },
        { id: '2', studentName: 'Trần Thị B', studentCode: 'SV002', submittedAt: new Date(Date.now() - 86400000).toISOString(), content: 'Bài luận văn bản PDF đính kèm.', fileUrl: 'https://cloudinary...', status: 'Graded', score: 8.5, feedback: 'Bài làm tốt, trình bày sạch sẽ.' }
      ]);
      this.isLoading.set(false);
    }, 500);
  }

  openGradingModal(sub: any) {
    this.selectedSubmission.set(sub);
    this.gradingForm.patchValue({
      score: sub.score || 0,
      feedback: sub.feedback || ''
    });
    this.isGradingModalOpen.set(true);
  }

  closeModal() {
    this.isGradingModalOpen.set(false);
    this.selectedSubmission.set(null);
  }

  submitGrade() {
    if (this.gradingForm.invalid) {
      this.gradingForm.markAllAsTouched();
      return;
    }

    const payload = this.gradingForm.value;
    const subId = this.selectedSubmission().id;

    // TODO: Gọi API lưu điểm xuống Backend C#
    console.log(`Đang lưu điểm cho bài ${subId}:`, payload);
    
    // Cập nhật giao diện tạm thời
    this.submissions.update(list => list.map(s => {
      if (s.id === subId) {
        return { ...s, score: payload.score, feedback: payload.feedback, status: 'Graded' };
      }
      return s;
    }));

    alert('Đã lưu điểm và nhận xét thành công!');
    this.closeModal();
  }
}