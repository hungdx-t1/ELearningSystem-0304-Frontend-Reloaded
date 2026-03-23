import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

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

  courseId = signal<string>('');
  lessonId = signal<string>('');
  
  // Danh sách câu hỏi của bài Quiz này
  questions = signal<any[]>([]);
  
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
    // Tạm thời dùng mock data, sau này bạn gọi API C# ở đây
    // this.quizService.getQuestionsByLessonId(this.lessonId()).subscribe(...)
    this.questions.set([
      { id: '1', content: 'HTML là viết tắt của từ gì?', optionA: 'Hyper Text Markup Language', optionB: 'Home Tool Markup Language', optionC: 'Hyperlinks and Text Markup Language', optionD: 'Hyper Tool Multi Language', correctOption: 'A' }
    ]);
  }

  openAddForm() {
    this.editingQuestionId.set(null);
    this.questionForm.reset({ correctOption: 'A' });
    this.isFormOpen.set(true);
  }

  openEditForm(q: any) {
    this.editingQuestionId.set(q.id);
    this.questionForm.patchValue(q);
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

    if (this.editingQuestionId()) {
      // Gọi API Cập nhật (Update)
      console.log('Đang cập nhật:', payload);
      alert('Đã cập nhật câu hỏi!');
    } else {
      // Gọi API Thêm mới (Create)
      console.log('Đang thêm mới:', payload);
      alert('Đã thêm câu hỏi mới!');
    }
    
    this.isFormOpen.set(false);
  }

  deleteQuestion(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      // Gọi API Xóa (Delete)
      this.questions.update(list => list.filter(q => q.id !== id));
    }
  }
}