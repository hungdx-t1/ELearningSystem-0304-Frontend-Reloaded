import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CourseService, Course, Chapter, Lesson } from '../../../../core/services/course.service';
import { SubmissionService } from '../../../../core/services/submission.service';
import { QuestionService, Question } from '../../../../core/services/question.service';

@Component({
  selector: 'app-lesson-player-component',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './lesson-player-component.html',
  styleUrl: './lesson-player-component.scss',
})
export class LessonPlayerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  
  private courseService = inject(CourseService);
  private submissionService = inject(SubmissionService);
  private questionService = inject(QuestionService);

  courseId = signal<string>('');
  lessonId = signal<string>('');
  
  // Dữ liệu Sidebar
  course = signal<Course | null>(null);
  chapters = signal<Chapter[]>([]);
  
  // Dữ liệu Bài học hiện tại
  currentLesson = signal<Lesson | null>(null);
  isLoading = signal<boolean>(true);

  // --- DỮ LIỆU RIÊNG CHO LOẠI 2: TRẮC NGHIỆM (QUIZ) ---
  questions = signal<Question[]>([]);
  quizAnswers = signal<{[key: string]: string}>({}); // Lưu đáp án SV chọn { questionId: 'A' }
  quizScore = signal<number | null>(null); // Điểm sau khi nộp

  // --- DỮ LIỆU RIÊNG CHO LOẠI 3: TỰ LUẬN (ASSIGNMENT) ---
  mySubmission = signal<any>(null); // Lưu thông tin bài đã nộp
  isUploading = signal<boolean>(false);
  
  submissionForm = this.fb.group({
    studentNote: [''],
    submissionUrl: ['']
  });

  // Tạm thời hardcode ClassId và StudentId (Vì SV phải đăng nhập và vào từ 1 Lớp học)
  // TODO: Sau này bạn lấy từ localStorage (Token) hoặc URL
  mockStudentId = '00000000-0000-0000-0000-000000000001'; 
  mockClassId = '00000000-0000-0000-0000-000000000001';

  ngOnInit() {
    // Theo dõi sự thay đổi của URL (để khi bấm bài khác trên sidebar nó tự load lại)
    this.route.paramMap.subscribe(params => {
      const cId = params.get('courseId');
      const lId = params.get('lessonId');
      
      if (cId && lId) {
        this.courseId.set(cId);
        this.lessonId.set(lId);
        this.loadCourseStructure(cId, lId);
      }
    });
  }

  async loadCourseStructure(courseId: string, currentLessonId: string) {
    this.isLoading.set(true);
    try {
      // 1. Kéo Khóa học & Chương (Nếu chưa có)
      if (!this.course()) {
        const c = await this.courseService.getCourseById(courseId);
        this.course.set(c);
      }

      const chapterList = await this.courseService.getChaptersByCourseId(courseId);
      
      let foundLesson = null;

      for (let chapter of chapterList) {
        chapter.lessons = await this.courseService.getLessonsByChapterId(chapter.id);
        chapter.isExpanded = true;
        
        // Tìm bài học hiện tại trong đống data vừa kéo về
        const match = chapter.lessons.find((l: any) => l.id === currentLessonId);
        if (match) foundLesson = match;
      }
      
      this.chapters.set(chapterList);
      
      if (foundLesson) {
        this.currentLesson.set(foundLesson);
        this.handleSpecificLessonLogic(foundLesson); // Xử lý logic riêng cho Quiz/Assignment
      }

    } catch (error) {
      console.error('Lỗi tải bài học:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- XỬ LÝ LOGIC THEO LOẠI BÀI HỌC ---
  handleSpecificLessonLogic(lesson: any) {
    // Nếu là Quiz (2): Kéo câu hỏi về
    if (lesson.type === 2) {
      this.questionService.getQuestionsByLessonId(lesson.id).subscribe({
        next: (data) => {
          this.questions.set(data);
          this.quizScore.set(null); // Reset điểm
          this.quizAnswers.set({}); // Reset đáp án
        }
      });
    }

    // Nếu là Assignment (3): Kéo bài nộp cũ về (nếu có)
    if (lesson.type === 3) {
      this.submissionService.getSubmissionAsync(this.mockClassId, lesson.id, this.mockStudentId).subscribe({
        next: (sub) => {
          if (sub) {
            this.mySubmission.set(sub);
            this.submissionForm.patchValue({ studentNote: sub.studentNote, submissionUrl: sub.submissionUrl });
          } else {
            this.mySubmission.set(null);
            this.submissionForm.reset();
          }
        },
        error: () => this.mySubmission.set(null) // Lỗi 404 (Chưa nộp) thì gán null
      });
    }
  }

  // --- LOGIC CHO QUIZ (TRẮC NGHIỆM) ---
  selectAnswer(questionId: string, option: string) {
    if (this.quizScore() !== null) return; // Đã nộp bài thì không cho sửa
    this.quizAnswers.update(answers => ({ ...answers, [questionId]: option }));
  }

  submitQuiz() {
    if (confirm('Bạn chắc chắn muốn nộp bài trắc nghiệm này?')) {
      const qList = this.questions();
      let correct = 0;
      const myAnswers = this.quizAnswers();

      qList.forEach(q => {
        if (myAnswers[q.id!] === q.correctOption) correct++;
      });

      const finalScore = (correct / qList.length) * 10;
      this.quizScore.set(Number(finalScore.toFixed(2))); // Cập nhật điểm lên UI
      
      // TODO: Bạn có thể gọi API lưu điểm này vào bảng Submission giống phần Tự luận
    }
  }

  // --- LOGIC CHO ASSIGNMENT (TỰ LUẬN) ---
  onFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploading.set(true);

    this.courseService.uploadFile(file).subscribe({
      next: (res) => {
        this.submissionForm.patchValue({ submissionUrl: res.url });
        this.isUploading.set(false);
      },
      error: () => {
        alert('Lỗi Upload file!');
        this.isUploading.set(false);
      }
    });
  }

  submitAssignment() {
    const payload = {
      lessonId: this.lessonId(),
      classId: this.mockClassId,
      studentId: this.mockStudentId,
      submissionUrl: this.submissionForm.value.submissionUrl,
      studentNote: this.submissionForm.value.studentNote
    };

    this.submissionService.submitWork(payload).subscribe({
      next: (res) => {
        alert('Đã nộp bài thành công!');
        this.mySubmission.set(res); // Cập nhật UI sang trạng thái "Đã nộp"
      },
      error: (err) => alert('Lỗi nộp bài: ' + err.message)
    });
  }
}