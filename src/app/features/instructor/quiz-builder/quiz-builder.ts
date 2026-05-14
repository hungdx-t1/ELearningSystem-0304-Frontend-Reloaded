import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Question, QuestionService } from '../../../core/services/question.service';
import { AiService } from '../../../core/services/ai.service';
import { NotificationService } from '../../../../v2/app/core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Chapter, CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-quiz-builder',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './quiz-builder.html',
})
export class QuizBuilder implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  private notiService = inject(NotificationService);

  private questionService = inject(QuestionService);
  private aiService = inject(AiService);
  private courseService = inject(CourseService);
  private authService = inject(AuthService);

  isOwner = signal<boolean>(false);
  currentUserId = this.authService.getCurrentUserId();

  courseId = signal<string>('');
  lessonId = signal<string>('');

  // Danh sách câu hỏi của bài Quiz này
  questions = signal<Question[]>([]);

  // Trạng thái Form
  isFormOpen = signal<boolean>(false);
  editingQuestionId = signal<string | null>(null);

  // Thêm biến này dưới khối khai báo trạng thái Modal AI
  aiFile = signal<File | null>(null);

  // --- TRẠNG THÁI MODAL AI ---
  isAiModalOpen = signal<boolean>(false);
  isGenerating = signal<boolean>(false);
  aiTopic = signal<string>('');
  aiCount = signal<number>(5); // Mặc định sinh 5 câu

  // Form chung 4 đáp án cố định (Rất dễ code và quản lý)
  questionForm = this.fb.group({
    content: ['', Validators.required],
    optionA: ['', Validators.required],
    optionB: ['', Validators.required],
    optionC: ['', Validators.required],
    optionD: ['', Validators.required],
    correctOption: ['A', Validators.required], // A, B, C hoặc D
    explanation: [''], // Lời giải thích (tùy chọn)
  });

  // BIẾN CHO PHẦN RAG (Lấy tài liệu hệ thống)
  courseChapters = signal<Chapter[]>([]);
  selectedLessonIds = signal<string[]>([]); // Lưu danh sách ID bài học đã tick

  // Tự động tính tổng số file đang được chọn
  totalSelectedFiles = computed(() => {
    const uploadedFileCount = this.aiFile() ? 1 : 0;
    const systemFileCount = this.selectedLessonIds().length;
    return uploadedFileCount + systemFileCount;
  });

  ngOnInit() {
    const cId = this.route.snapshot.paramMap.get('courseId');
    const lId = this.route.snapshot.paramMap.get('lessonId');

    if (cId && lId) {
      this.courseId.set(cId);
      this.lessonId.set(lId);

      this.courseService.getCourseById(cId).then((course) => {
        this.isOwner.set(course.creatorId === this.currentUserId);
      });

      this.loadQuestions();
    }
  }

  loadQuestions() {
    this.questionService.getQuestionsByLessonId(this.lessonId()).subscribe({
      next: (data) => this.questions.set(data),
      error: (err) => console.error('Lỗi khi tải câu hỏi:', err),
    });
  }

  openAddForm() {
    this.editingQuestionId.set(null);
    this.questionForm.reset({ correctOption: 'A' });
    this.isFormOpen.set(true);
  }

  openEditForm(q: Question) {
    // Dùng || null để nếu q.id bị undefined thì nó tự biến thành null
    this.editingQuestionId.set(q.id || null);

    this.questionForm.patchValue({
      content: q.content,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      explanation: q.explanation,
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
      ...this.questionForm.value,
    };

    const id = this.editingQuestionId();

    if (id) {
      // API UPDATE
      this.questionService.updateQuestion(id, payload).subscribe({
        next: () => {
          this.loadQuestions(); // Cập nhật danh sách bên trái
          this.isFormOpen.set(false); // Đóng form
        },
        error: (err) =>
          this.notiService.error('Lỗi cập nhật: ' + (err.error?.message || err.message)),
      });
    } else {
      // API CREATE
      this.questionService.createQuestion(payload).subscribe({
        next: () => {
          this.loadQuestions();
          this.isFormOpen.set(false);
        },
        error: (err) =>
          this.notiService.error('Lỗi thêm mới: ' + (err.error?.message || err.message)),
      });
    }
  }

  deleteQuestion(id?: string) {
    if (!id) return;

    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này vĩnh viễn?')) {
      this.questionService.deleteQuestion(id).subscribe({
        next: () => {
          this.questions.update((list) => list.filter((q) => q.id !== id));
          if (this.editingQuestionId() === id) {
            this.isFormOpen.set(false);
          }
        },
        error: (err) => this.notiService.error('Lỗi xóa: ' + (err.error?.message || err.message)),
      });
    }
  }

  // --- LOGIC CHO AI GENERATOR ---
  async openAiModal() {
    this.isAiModalOpen.set(true);

    // Tải cấu trúc khóa học để hiển thị Checkbox
    if (this.courseChapters().length === 0) {
      try {
        const chapters = await this.courseService.getChaptersByCourseId(this.courseId());
        // Tải bài học cho từng chương
        for (let ch of chapters) {
          const lessons = await this.courseService.getLessonsByChapterId(ch.id);
          // Chỉ lấy bài học dạng Document (type === 1) có chứa link
          ch.lessons = lessons.filter((l) => l.type === 1 && l.documentUrl);
        }
        this.courseChapters.set(chapters);
      } catch (err) {
        console.error('Lỗi tải cây bài học', err);
      }
    }
  }

  // Hàm tick/bỏ tick bài học
  toggleLessonSelection(lessonId: string) {
    const currentList = this.selectedLessonIds();
    if (currentList.includes(lessonId)) {
      this.selectedLessonIds.set(currentList.filter((id) => id !== lessonId));
    } else {
      this.selectedLessonIds.set([...currentList, lessonId]);
    }
  }

  closeAiModal() {
    if (this.isGenerating()) return; // Đang chạy thì không cho đóng
    this.isAiModalOpen.set(false);
    this.aiTopic.set('');
    this.aiFile.set(null); // Reset file
  }

  generateWithAi() {
    if (!this.aiFile() && !this.aiTopic().trim() && this.selectedLessonIds().length === 0) {
      this.notiService.error(
        'Vui lòng cung cấp ít nhất 1 nguồn: Chủ đề, Tài liệu tải lên, hoặc Chọn bài học!',
      );
      return;
    }
    if (this.aiCount() <= 0 || this.aiCount() > 20) {
      this.notiService.error('Số lượng câu hỏi tối đa là 20 câu 1 lần.');
      return;
    }

    this.isGenerating.set(true);

    this.aiService
      .generateQuiz(this.aiTopic(), this.aiCount(), this.selectedLessonIds(), this.aiFile())
      .subscribe({
        next: (generatedQuestions: any[]) => {
          if (generatedQuestions && generatedQuestions.length > 0) {
            let completedCount = 0;
            generatedQuestions.forEach((q) => {
              const payload = { lessonId: this.lessonId(), ...q };
              this.questionService.createQuestion(payload).subscribe({
                next: () => {
                  completedCount++;
                  if (completedCount === generatedQuestions.length) {
                    this.notiService.success(
                      `✨ AI đã bóc tách tài liệu và lưu thành công ${completedCount} câu hỏi!`,
                    );
                    this.loadQuestions();
                    this.isGenerating.set(false);
                    this.closeAiModal();
                  }
                },
                error: (err) => console.error(err),
              });
            });
          } else {
            this.notiService.error(
              'AI không thể đọc được file này. Vui lòng thử file PDF/TXT khác.',
            );
            this.isGenerating.set(false);
          }
        },
        error: (err) => {
          this.notiService.error(
            'Lỗi kết nối với não bộ AI: ' + (err.error?.message || err.message),
          );
          this.isGenerating.set(false);
        },
      });
  }

  // hàm bắt sự kiện chọn file
  onAiFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.aiFile.set(input.files[0]);
    } else {
      this.aiFile.set(null);
    }
  }
}
