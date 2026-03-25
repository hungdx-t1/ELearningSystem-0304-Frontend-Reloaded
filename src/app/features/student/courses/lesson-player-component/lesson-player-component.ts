import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CourseService, Course, Chapter, Lesson } from '../../../../core/services/course.service';
import { SubmissionService } from '../../../../core/services/submission.service';
import { QuestionService, Question } from '../../../../core/services/question.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DomSanitizer } from '@angular/platform-browser';
import { NotificationService } from '../../../../../v2/app/core/services/notification.service';

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

  private authService = inject(AuthService);
  
  private courseService = inject(CourseService);
  private submissionService = inject(SubmissionService);
  private questionService = inject(QuestionService);

  private notiService = inject(NotificationService);

  // Tiêm DomSanitizer vào
  private sanitizer = inject(DomSanitizer);

  courseId = signal<string>('');
  lessonId = signal<string>('');
  
  // Dữ liệu Sidebar
  course = signal<Course | null>(null);
  chapters = signal<Chapter[]>([]);
  
  // Dữ liệu Bài học hiện tại
  currentLesson = signal<Lesson | null>(null);
  isLoading = signal<boolean>(true);

  // 1. Kiểm tra xem link có phải của YouTube không
  isYouTubeVideo = computed(() => {
    const url = this.currentLesson()?.videoUrl;
    return url ? (url.includes('youtube.com') || url.includes('youtu.be')) : false;
  });

  // 2. Hàm Regex thần thánh bóc tách ID YouTube từ mọi thể loại link
  getYouTubeEmbedUrl(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return 'https://www.youtube.com/embed/' + match[2];
    }
    return null;
  }

  // 3. Tạo link an toàn cho iframe (Cân cả YouTube lẫn PDF Cloudinary)
  safeResourceUrl = computed(() => {
    const lesson = this.currentLesson();
    if (!lesson || !lesson.videoUrl) return null;

    if (this.isYouTubeVideo()) {
      const embedUrl = this.getYouTubeEmbedUrl(lesson.videoUrl);
      return embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
    }

    // Nếu không phải YouTube thì trả về link gốc (PDF, mp4 của Cloudinary...)
    return this.sanitizer.bypassSecurityTrustResourceUrl(lesson.videoUrl);
  });

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

  // LẤY ID THẬT TỪ LOCAL STORAGE QUA AUTH SERVICE
  realStudentId = this.authService.getCurrentUserId(); 

  classId = signal<string>('');

  ngOnInit() {
    // 1. Đọc cái classId ẩn trên URL (?classId=...)
    this.route.queryParamMap.subscribe(qParams => {
      const clsId = qParams.get('classId');
      if (clsId) {
        this.classId.set(clsId);
      }
    });

    // 2. Kéo dữ liệu Bài học (Giữ nguyên như cũ)
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
    // NẾU LÀ QUIZ (2): Kéo câu hỏi và Điểm cũ về
    if (lesson.type === 2) {
      this.questionService.getQuestionsByLessonId(lesson.id).subscribe({
        next: (data) => {
          this.questions.set(data);
          
          // Kiểm tra xem đã làm bài này chưa bằng ID Thật
          this.submissionService.getSubmissionAsync(this.classId(), lesson.id, this.realStudentId).subscribe({
            next: (sub) => {
              if (sub && sub.score != null) {
                this.quizScore.set(sub.score ?? null); 
              } else {
                this.quizScore.set(null); 
                this.quizAnswers.set({});
              }
            },
            error: () => {
              this.quizScore.set(null);
              this.quizAnswers.set({});
            }
          });
        }
      });
    }

    // NẾU LÀ TỰ LUẬN (3): (Giữ nguyên như cũ)
    if (lesson.type === 3) {
      this.submissionService.getSubmissionAsync(this.classId(), lesson.id, this.realStudentId).subscribe({
        next: (sub) => {
          if (sub) {
            this.mySubmission.set(sub);
            this.submissionForm.patchValue({ studentNote: sub.studentNote, submissionUrl: sub.submissionUrl });
          } else {
            this.mySubmission.set(null);
            this.submissionForm.reset();
          }
        },
        error: () => this.mySubmission.set(null) 
      });
    }
  }

  // --- LOGIC CHO QUIZ (TRẮC NGHIỆM) ---
  selectAnswer(questionId: string, option: string) {
    if (this.quizScore() !== null) return; // Đã nộp bài thì không cho sửa
    this.quizAnswers.update(answers => ({ ...answers, [questionId]: option }));
  }

  // --- LOGIC KHI BẤM NÚT NỘP BÀI QUIZ ---
  submitQuiz() {
    if (confirm('Bạn chắc chắn muốn nộp bài trắc nghiệm này?')) {
      const qList = this.questions();
      let correct = 0;
      const myAnswers = this.quizAnswers();

      // Chấm điểm tại máy khách
      qList.forEach(q => {
        if (myAnswers[q.id!] === q.correctOption) correct++;
      });

      const finalScore = Number(((correct / qList.length) * 10).toFixed(2));
      this.quizScore.set(finalScore); // Cập nhật UI ngay lập tức
      
      // Gói dữ liệu gửi xuống Backend C# với ID Thật
      const payload = {
        lessonId: this.lessonId(),
        classId: this.classId(),
        studentId: this.realStudentId,
        submissionUrl: this.submissionForm.value.submissionUrl,
        score: finalScore
      };

      this.submissionService.submitQuiz(payload).subscribe({
        next: () => {
          this.notiService.success(`Đã nộp bài! Điểm của bạn là: ${finalScore}/10`);
        },
        error: (err) => this.notiService.error('Lỗi khi lưu điểm: ' + (err.error?.message || err.message))
      });
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
        this.notiService.error('Lỗi Upload file!');
        this.isUploading.set(false);
      }
    });
  }

  submitAssignment() {
    const payload = {
      lessonId: this.lessonId(),
      classId: this.classId(),
      studentId: this.realStudentId, // Dùng ID Thật
      submissionUrl: this.submissionForm.value.submissionUrl,
      studentNote: this.submissionForm.value.studentNote
    };

    this.submissionService.submitWork(payload).subscribe({
      next: (res) => {
        this.notiService.success('Đã nộp bài thành công!');
        this.mySubmission.set(res); // Cập nhật UI sang trạng thái "Đã nộp"
      },
      error: (err) => this.notiService.error('Lỗi nộp bài: ' + (err.error?.message || err.message))
    });
  }
}