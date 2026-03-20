import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService, Course, Chapter, Lesson } from '../../../core/services/course.service';

@Component({
  selector: 'app-instructor-course-editor',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './course-editor.html'
})
export class CourseEditor implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);

  courseId = signal<string>('');
  courseInfo = signal<Course | null>(null);
  
  // Mảng chứa các Chương (Mỗi chương sẽ cõng thêm mảng Bài học ở trong)
  chapters = signal<Chapter[]>([]);
  isLoading = signal<boolean>(true);

  // Quản lý Modal
  isChapterModalOpen = signal<boolean>(false);
  isLessonModalOpen = signal<boolean>(false);
  
  selectedChapterId = signal<string>(''); // Nhớ xem đang thêm bài học cho chương nào

  chapterForm = this.fb.group({
    title: ['', Validators.required],
    sortOrder: [1, Validators.required]
  });

  lessonForm = this.fb.group({
    title: ['', Validators.required],
    type: [0, Validators.required], // 0: Video, 1: Document, 2: Quiz
    videoUrl: [''],
    sortOrder: [1, Validators.required]
  });

  ngOnInit() {
    // Lấy ID khóa học từ URL (ví dụ: /instructor/courses/123/manage)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId.set(id);
      this.loadCourseContent(id);
    } else {
      this.router.navigate(['/instructor/courses']);
    }
  }

  async loadCourseContent(id: string) {
    this.isLoading.set(true);
    try {
      // 1. Kéo thông tin khóa học
      const course = await this.courseService.getCourseById(id);
      this.courseInfo.set(course);

      // 2. Kéo danh sách các Chương
      const chapterList = await this.courseService.getChaptersByCourseId(id);
      
      // 3. Với mỗi Chương, kéo các Bài học của nó về (Lắp ghép dữ liệu)
      for (let chap of chapterList) {
        const lessons = await this.courseService.getLessonsByChapterId(chap.id);
        chap.lessons = lessons;
        chap.isExpanded = true; // Mặc định mở rộng để dễ nhìn
      }

      // Đưa vào Signal để render ra UI
      // Sắp xếp chương theo thứ tự SortOrder
      this.chapters.set(chapterList.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (error) {
      console.error('Lỗi tải nội dung khóa học', error);
      alert('Không thể tải dữ liệu khóa học!');
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- XỬ LÝ CHƯƠNG (CHAPTER) ---
  openChapterModal() {
    this.chapterForm.reset({ sortOrder: this.chapters().length + 1 });
    this.isChapterModalOpen.set(true);
  }

  saveChapter() {
    if (this.chapterForm.invalid) return;
    const payload = { 
      courseId: this.courseId(), 
      title: this.chapterForm.value.title!, 
      sortOrder: this.chapterForm.value.sortOrder! 
    };

    this.courseService.createChapter(payload).subscribe({
      next: () => {
        this.loadCourseContent(this.courseId()); // Tải lại cây dữ liệu
        this.isChapterModalOpen.set(false);
      },
      error: (err) => alert('Lỗi tạo Chương: ' + err.message)
    });
  }

  // --- XỬ LÝ BÀI HỌC (LESSON) ---
  openLessonModal(chapterId: string) {
    this.selectedChapterId.set(chapterId);
    
    // Tìm chương hiện tại để đếm xem đang có bao nhiêu bài học rồi
    const currentChap = this.chapters().find(c => c.id === chapterId);
    const nextOrder = currentChap && currentChap.lessons ? currentChap.lessons.length + 1 : 1;

    this.lessonForm.reset({ type: 0, sortOrder: nextOrder });
    this.isLessonModalOpen.set(true);
  }

  saveLesson() {
    if (this.lessonForm.invalid) return;
    const formVal = this.lessonForm.value;
    const payload = {
      chapterId: this.selectedChapterId(),
      title: formVal.title!,
      type: Number(formVal.type),
      videoUrl: formVal.videoUrl || undefined,
      sortOrder: formVal.sortOrder!
    };

    this.courseService.createLesson(payload).subscribe({
      next: () => {
        this.loadCourseContent(this.courseId()); // Tải lại cây dữ liệu
        this.isLessonModalOpen.set(false);
      },
      error: (err) => alert('Lỗi tạo Bài học: ' + err.message)
    });
  }

  toggleChapter(chapter: Chapter) {
    chapter.isExpanded = !chapter.isExpanded;
  }
}