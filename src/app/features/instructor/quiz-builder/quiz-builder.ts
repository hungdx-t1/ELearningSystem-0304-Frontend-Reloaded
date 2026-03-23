import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Question, QuestionService } from '../../../core/services/question.service';

@Component({
  selector: 'app-quiz-builder',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './quiz-builder.html'
})
export class QuizBuilder implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  private questionService = inject(QuestionService);

  courseId = signal<string>('');
  lessonId = signal<string>('');
  
  // Danh sách câu hỏi của bài Quiz này
  questions = signal<Question[]>([]);
  
  // Trạng thái Form
  isFormOpen = signal<boolean>(false);
  editingQuestionId = signal<string | null>(null);

  // Form chung 4 đáp án cố định (Rất dễ code và quản lý)
  questionForm = this.fb.group({
    content: ['', Validators.required],
    optionA: ['', Validators.required],
    optionB: ['', Validators.required],
    optionC: ['', Validators.required],
    optionD: ['', Validators.required],
    correctOption: ['A', Validators.required], // A, B, C hoặc D
    explanation: [''] // Lời giải thích (tùy chọn)
  });

  ngOnInit() {
    const cId = this.route.snapshot.paramMap.get('courseId');
    const lId = this.route.snapshot.paramMap.get('lessonId');
    
    if (cId && lId) {
      this.courseId.set(cId);
      this.lessonId.set(lId);
      this.loadQuestions();
    }
  }

  loadQuestions() {
    this.questionService.getQuestionsByLessonId(this.lessonId()).subscribe({
      next: (data) => this.questions.set(data),
      error: (err) => console.error('Lỗi khi tải câu hỏi:', err)
    });
  }

  openAddForm() {
    this.editingQuestionId.set(null);
    this.questionForm.reset({ correctOption: 'A' });
    this.isFormOpen.set(true);
  }

  openEditForm(q: Question) {
    this.editingQuestionId.set(q.id!);
    this.questionForm.patchValue({
      content: q.content,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      explanation: q.explanation
    });
    this.isFormOpen.set(true);
  }

  cancelForm() {
    this.isFormOpen.set(false);
  }

  saveQuestion() {
    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      return;
    }

    const payload = {
      lessonId: this.lessonId(),
      ...this.questionForm.value
    };

    const id = this.editingQuestionId();
    
    if (id) {
      // API UPDATE
      this.questionService.updateQuestion(id, payload).subscribe({
        next: () => {
          this.loadQuestions(); // Cập nhật danh sách bên trái
          this.isFormOpen.set(false); // Đóng form
        },
        error: (err) => alert('Lỗi cập nhật: ' + (err.error?.message || err.message))
      });
    } else {
      // API CREATE
      this.questionService.createQuestion(payload).subscribe({
        next: () => {
          this.loadQuestions(); 
          this.isFormOpen.set(false);
        },
        error: (err) => alert('Lỗi thêm mới: ' + (err.error?.message || err.message))
      });
    }
  }

  deleteQuestion(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này vĩnh viễn?')) {
      this.questionService.deleteQuestion(id).subscribe({
        next: () => {
          // Xóa mượt trên giao diện khỏi tốn công load lại toàn bộ
          this.questions.update(list => list.filter(q => q.id !== id));
          
          // Nếu đang mở form sửa chính câu này thì đóng form lại
          if (this.editingQuestionId() === id) {
            this.isFormOpen.set(false);
          }
        },
        error: (err) => alert('Lỗi xóa: ' + (err.error?.message || err.message))
      });
    }
  }
}