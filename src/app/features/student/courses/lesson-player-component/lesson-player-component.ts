import { Component, inject, OnInit, OnDestroy, signal, computed, HostListener } from '@angular/core';
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
export class LessonPlayerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  private authService = inject(AuthService);
  
  private courseService = inject(CourseService);
  private submissionService = inject(SubmissionService);
  private questionService = inject(QuestionService);

  private notiService = inject(NotificationService);

  // Tiêm DomSanitizer vào
  private sanitizer = inject(DomSanitizer);

  // anti-cheat variables
  cheatWarnings = signal<number>(0);
  maxWarnings = 3;

  courseId = signal<string>('');
  lessonId = signal<string>('');
  
  // Dữ liệu Sidebar
  course = signal<Course | null>(null);
  chapters = signal<Chapter[]>([]);
  
  // Dữ liệu Bài học hiện tại
  currentLesson = signal<Lesson | null>(null);
  isLoading = signal<boolean>(true);

  // kiểm tra: khỉ bắt gian lận nếu là Bài Thi và Chưa Nộp Bài
  isDoingExam(): boolean {
    const lesson = this.currentLesson();
    // Nếu không phải bài thi thì tắt Anti-cheat
    if (!lesson || !lesson.isExam) return false;

    if (lesson.type === 2) {
      // Trắc nghiệm: Bật Anti-cheat nếu chưa nộp bài (điểm null)
      return this.quizScore() === null;
    } else if (lesson.type === 3) {
      // Tự luận: Bật Anti-cheat nếu chưa nộp (!mySubmission) hoặc nộp rồi nhưng điểm null (chưa chấm)
      return !this.mySubmission() || this.mySubmission()?.score == null;
    }
    
    return false;
  }

  // 1. Kiểm tra xem link có phải của YouTube không
  isYouTubeVideo = computed(() => {
    const lesson = this.currentLesson();
    const url = lesson?.videoUrl || lesson?.documentUrl;
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
    if (!lesson) return null;
    
    // Hỗ trợ cả 2 trường url tuỳ theo cách bạn lưu trong DB
    const url = lesson.videoUrl || lesson.documentUrl;
    if (!url) return null;

    if (this.isYouTubeVideo()) {
      const embedUrl = this.getYouTubeEmbedUrl(url);
      return embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
    }

    // MẸO VI DIỆU: Dùng Google Docs Viewer để nhúng PDF trực tiếp vào màn hình 
    // Tránh bị trình duyệt chặn hoặc tự tải file về máy
    if (url.toLowerCase().endsWith('.pdf') || url.includes('/raw/upload/')) {
      const docsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(docsUrl);
    }

    // Nếu không phải YouTube thì trả về link gốc (mp4 của Cloudinary...)
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // --- DỮ LIỆU RIÊNG CHO LOẠI 2: TRẮC NGHIỆM (QUIZ) ---
  questions = signal<Question[]>([]);
  quizAnswers = signal<{[key: string]: string}>({}); // Lưu đáp án SV chọn { questionId: 'A' }
  quizScore = signal<number | null>(null); // Điểm sau khi nộp

  // --- DỮ LIỆU RIÊNG CHO LOẠI 3: TỰ LUẬN (ASSIGNMENT) ---
  mySubmission = signal<any>(null); // Lưu thông tin bài đã nộp
  isUploading = signal<boolean>(false);
  
  // --- TIMER CHO BÀI THI TỪ SERVER ---
  hasStartedExam = signal<boolean>(false);
  classLessonSchedule = signal<any>(null);

  timeLeft = signal<number | null>(null);
  timerDisplay = computed(() => {
    const t = this.timeLeft();
    if (t === null) return '';
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = (t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });
  private timerInterval: any;

  ngOnDestroy() {
    this.clearTimer();
  }
  
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
    if (lesson.type === 2) {
      // 1. Nếu là Quiz, phải Load list câu hỏi trước đã
      this.questionService.getQuestionsByLessonId(lesson.id).subscribe({
        next: (data) => {
          this.questions.set(data);
          this.checkExamState(lesson);
        }
      });
    }

    if (lesson.type === 3) {
      // Tự luận thì gọi thẳng luồng kiểm tra Server
      this.checkExamState(lesson);
    }
  }

  // 1. Kiểm tra trạng thái Bài thi (Xem đã bấm Bắt đầu chưa)
  checkExamState(lesson: any) {
    if (!lesson.isExam) {
       this.hasStartedExam.set(true); // Không phải bài thi => Mặc định hiện LUÔN nội dung
       
       // Vẫn load lại bài đã nộp nếu có để hiển thị ckeck mark xanh...
       this.submissionService.getSubmissionAsync(this.classId(), lesson.id, this.realStudentId).subscribe({
        next: (sub) => this.applySubmissionState(lesson, sub, null),
        error: () => this.applySubmissionState(lesson, null, null)
       });
       return;
    }

    // Nếu là BÀI THI => Cần check cấu hình từ ClassLessonSchedule
    this.courseService.getClassLessonSchedule(this.classId(), lesson.id).subscribe({
      next: (schedule) => {
        this.classLessonSchedule.set(schedule);
        
        // 2. Kéo State của Sinh viên xem đã từng click Bắt đầu chưa
        this.submissionService.getSubmissionAsync(this.classId(), lesson.id, this.realStudentId).subscribe({
           next: (sub) => {
              if (sub && sub.startedAt) {
                 this.hasStartedExam.set(true);
                 this.applySubmissionState(lesson, sub, schedule); // Đã bấm => Hiển thị đề, tính h
              } else {
                 this.hasStartedExam.set(false);
                 this.applySubmissionState(lesson, null, schedule); // Chưa bấm => Hiện nút Bắt đầu
              }
           },
           error: () => {
              this.hasStartedExam.set(false);
              this.applySubmissionState(lesson, null, schedule);
           }
        });
      }
    });
  }

  // 2. Hàm kích hoạt khi Sinh viên bấm "Bắt Đầu Làm Bài" trên màn hình Gate
  startExamNow() {
    const lesson = this.currentLesson();
    if (!lesson) return;

    const schedule = this.classLessonSchedule();
    const now = new Date().getTime();
    
    // Check nếu bấm ngoài giờ
    if (schedule?.startTime && now < new Date(schedule.startTime).getTime()) {
        alert('🛑 Chưa đến giờ mở đề theo cấu hình của Giảng viên quy định!');
        return;
    }
    if (schedule?.dueDate && now > new Date(schedule.dueDate).getTime()) {
        alert('⏳ Rất tiếc, bài kiểm tra này đã khóa lại!');
        return;
    }

    this.isLoading.set(true);
    // Ghi nhận giây sinh viên đọc đề
    this.submissionService.startExam(this.classId(), lesson.id).subscribe({
        next: (sub) => {
            this.isLoading.set(false);
            this.hasStartedExam.set(true);
            this.applySubmissionState(lesson, sub, schedule);
        },
        error: (err) => {
           this.isLoading.set(false);
           this.notiService.error("Lỗi tải đề thi, vui lòng thử lại sau!");
        }
    });
  }

  // 3. Render dữ liệu và kích hoạt Đếm Ngược
  applySubmissionState(lesson: any, sub: any, schedule: any) {
    // Load state nếu đã nộp tự luận
    if (lesson.type === 3) {
      if (sub && sub.isSubmitted) {
        this.mySubmission.set(sub);
        this.submissionForm.patchValue({ studentNote: sub.studentNote, submissionUrl: sub.submissionUrl });
      } else {
        this.mySubmission.set(null);
        this.submissionForm.reset();
      }
    }

    // Load state nếu đã nộp trắc nghiệm
    if (lesson.type === 2) {
      if (sub && sub.score != null) {
        this.quizScore.set(sub.score ?? null); 
        if (sub.quizAnswersJson) {
          try {
            const parsedAnswers = JSON.parse(sub.quizAnswersJson);
            this.quizAnswers.set(parsedAnswers);
          } catch (e) {}
        }
      } else {
        this.quizScore.set(null);
        this.quizAnswers.set({});
      }
    }

    // Nếu đã BẮT ĐẦU và CHƯA NỘP -> Cho đếm lùi
    if (this.hasStartedExam() && this.isDoingExam() && sub?.startedAt) {
      const currentDuration = schedule?.overrideDuration || lesson.duration;
      // Chạy bộ đếm từ Backend Time (tránh cheat)
      this.calculateBackendTimer(lesson, sub.startedAt, currentDuration);
    }
  }

  // HÀM TÍNH TOÁN ĐẾM LÙI TỪ BACKEND
  calculateBackendTimer(lesson: any, startedAt: string, durationInMinutes: number) {
     this.clearTimer();
     if (!startedAt || !durationInMinutes) return;
     
     // Thêm 'Z' nếu server BE trả chuỗi chưa định dạng UTC, cần cẩn thận múi giờ
     const startString = startedAt.endsWith('Z') ? startedAt : startedAt + 'Z';
     const start = new Date(startString).getTime(); 
     const durationSec = durationInMinutes * 60;
     
     // Cập nhật ngay lần đầu
     this.processTick(lesson, start, durationSec);

     // Đếm xuống mỗi giây
     this.timerInterval = setInterval(() => {
        this.processTick(lesson, start, durationSec);
     }, 1000);
  }

  processTick(lesson: any, startTime: number, durationSec: number) {
     const now = new Date().getTime();
     const elapsedSec = Math.floor((now - startTime) / 1000);
     const remaining = durationSec - elapsedSec;

     if (remaining <= 0) {
        this.clearTimer();
        this.forceSubmit(lesson, 'đã hết giờ làm bài');
     } else {
        this.timeLeft.set(remaining);
     }
  }

  clearTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timeLeft.set(null);
  }

  forceSubmit(lesson: any, reason: string) {
    alert(`⏳ HỆ THỐNG ĐÃ TRỰC TIẾP NỘP BÀI THI VÌ ${reason.toUpperCase()}!`);
    if (lesson.type === 2) this.submitQuiz(true); // Ép nộp không xuất Confirm
    if (lesson.type === 3) this.submitAssignment();
  }

  // --- LOGIC CHO QUIZ (TRẮC NGHIỆM) ---
  selectAnswer(questionId: string, option: string) {
    if (this.quizScore() !== null) return; // Đã nộp bài thì không cho sửa
    this.quizAnswers.update(answers => ({ ...answers, [questionId]: option }));
  }

  // --- LOGIC KHI BẤM NÚT NỘP BÀI QUIZ ---
  submitQuiz(skipConfirm = false) {
    if (skipConfirm || confirm('Bạn chắc chắn muốn nộp bài trắc nghiệm này?')) {
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
        score: finalScore,
        quizAnswersJson: JSON.stringify(myAnswers),
        isSubmitted: true,
        cheatWarnings: this.cheatWarnings()
        // submissionUrl: this.submissionForm.value.submissionUrl,
      };

      this.submissionService.submitQuiz(payload).subscribe({
        next: () => {
          this.notiService.success(`Đã nộp bài! Điểm của bạn là: ${finalScore}/10`);
          this.clearTimer();
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
      studentNote: this.submissionForm.value.studentNote,
      cheatWarnings: this.cheatWarnings()
    };

    this.submissionService.submitWork(payload).subscribe({
      next: (res) => {
        this.notiService.success('Đã nộp bài thành công!');
        this.mySubmission.set(res); // Cập nhật UI sang trạng thái "Đã nộp"
        this.clearTimer();
      },
      error: (err) => this.notiService.error('Lỗi nộp bài: ' + (err.error?.message || err.message))
    });
  }

  // xử lý gian lận
  handleCheatAttempt(message: string) {
    this.cheatWarnings.update(w => w + 1);
    
    // Nếu vi phạm 3 lần -> Ép nộp bài
    if (this.cheatWarnings() >= this.maxWarnings) {
      alert('🚫 BẠN ĐÃ VI PHẠM QUY CHẾ THI QUÁ 3 LẦN. BÀI THI SẼ TỰ ĐỘNG NỘP!');
      
      // Chạy hàm nộp bài tương ứng
      if (this.currentLesson()?.type === 2) this.submitQuiz(true);
      if (this.currentLesson()?.type === 3) this.submitAssignment();
      
    } else {
      alert(`⚠️ CẢNH BÁO GIAN LẬN (${this.cheatWarnings()}/${this.maxWarnings}):\n${message}`);
    }
  }

  // sự kiện 1: chuyển tab hoặc ẩn trình duyệt đi khi đang làm bài thi
  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (document.hidden && this.isDoingExam()) {
      this.handleCheatAttempt('Hệ thống phát hiện bạn vừa chuyển Tab hoặc rời khỏi màn hình làm bài!');
    }
  }

  // sự kiện 2: mở app khác khi đang làm bài thi
  @HostListener('window:blur')
  onWindowBlur() {
    if (this.isDoingExam()) {
      this.handleCheatAttempt('Bạn đang mất tập trung (chuyển sang ứng dụng khác). Vui lòng quay lại bài thi!');
    }
  }

  // sự kiện 3: chuột phải khi đang làm bài thi
  @HostListener('document:contextmenu', ['$event'])
  onRightClick(event: Event) {
    if (this.isDoingExam()) event.preventDefault();
  }

  // sự kiện 4: chặn phím Ctrl+C, Ctrl+V khi đang làm bài thi
  @HostListener('document:keydown', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    if (this.isDoingExam() && (event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'C' || event.key === 'v' || event.key === 'V')) {
      event.preventDefault();
      this.notiService.warning('Chức năng Copy/Paste đã bị vô hiệu hóa trong bài thi!');
    }
  }

  // sự kiện 5: copy trực tiếp
  @HostListener('document:copy', ['$event'])
  onCopy(event: ClipboardEvent) {
    if (this.isDoingExam()) event.preventDefault();
  }

}