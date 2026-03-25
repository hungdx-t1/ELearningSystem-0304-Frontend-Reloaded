import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService, Course, Chapter, Lesson } from '../../../core/services/course.service';

@Component({
  selector: 'app-instructor-course-editor',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
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
  chapterModalMode = signal<'add' | 'edit'>('add');

  isLessonModalOpen = signal<boolean>(false);
  lessonModalMode = signal<'add' | 'edit'>('add');
  
  selectedChapterId = signal<string>(''); 
  selectedLessonId = signal<string>('');

  isUploading = signal<boolean>(false);

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
    this.chapterModalMode.set('add');
    this.chapterForm.reset({ sortOrder: this.chapters().length + 1 });
    this.isChapterModalOpen.set(true);
  }

  openEditChapterModal(chapter: Chapter, event: Event) {
    event.stopPropagation(); // Ngăn sự kiện click làm thu gọn/mở rộng chương
    this.chapterModalMode.set('edit');
    this.selectedChapterId.set(chapter.id);
    this.chapterForm.patchValue({
      title: chapter.title,
      sortOrder: chapter.sortOrder
    });
    this.isChapterModalOpen.set(true);
  }

  saveChapter() {
    if (this.chapterForm.invalid) return;
    const payload = { 
      courseId: this.courseId(), 
      title: this.chapterForm.value.title!, 
      sortOrder: this.chapterForm.value.sortOrder! 
    };

    if (this.chapterModalMode() === 'add') {
      this.courseService.createChapter(payload).subscribe({
        next: () => { this.loadCourseContent(this.courseId()); this.isChapterModalOpen.set(false); },
        error: (err) => alert('Lỗi: ' + err.message)
      });
    } else {
      this.courseService.updateChapter(this.selectedChapterId(), payload).subscribe({
        next: () => { 
          this.loadCourseContent(this.courseId()); 
          this.isChapterModalOpen.set(false); 
        },
        error: (err) => alert('Lỗi cập nhật Chương: ' + (err.error?.message || err.message))
      });
    }
  }

  deleteChapter(chapter: Chapter, event: Event) {
    event.stopPropagation();
    if (confirm(`Xóa "${chapter.title}" sẽ xóa TOÀN BỘ bài học bên trong. Bạn chắc chắn chứ?`)) {
      this.courseService.deleteChapter(chapter.id).subscribe({
        next: () => this.loadCourseContent(this.courseId()),
        error: (err) => alert('Lỗi xóa Chương: ' + (err.error?.message || err.message))
      });
    }
  }

  toggleChapter(chapter: Chapter) {
    chapter.isExpanded = !chapter.isExpanded;
  }

  // --- XỬ LÝ BÀI HỌC (LESSON) ---
  openLessonModal(chapterId: string, event: Event) {
    event.stopPropagation();
    this.lessonModalMode.set('add');
    this.selectedChapterId.set(chapterId);
    
    const currentChap = this.chapters().find(c => c.id === chapterId);
    const nextOrder = currentChap && currentChap.lessons ? currentChap.lessons.length + 1 : 1;

    this.lessonForm.reset({ type: 0, sortOrder: nextOrder });
    this.isLessonModalOpen.set(true);
  }

  openEditLessonModal(lesson: Lesson, chapterId: string, event: Event) {
    event.stopPropagation();
    this.lessonModalMode.set('edit');
    this.selectedLessonId.set(lesson.id);
    this.selectedChapterId.set(chapterId);
    
    this.lessonForm.patchValue({
      title: lesson.title,
      type: lesson.type,
      // Phân làn khi sửa: Nếu là Tài liệu thì lấy documentUrl đắp lên form, ngược lại lấy videoUrl
      videoUrl: lesson.type === 1 ? lesson.documentUrl : lesson.videoUrl,
      sortOrder: lesson.sortOrder
    });
    this.isLessonModalOpen.set(true);
  }

  saveLesson() {
    if (this.lessonForm.invalid) return;
    const formVal = this.lessonForm.value;
    const typeNum = Number(formVal.type);

    // Bắt đầu phân làn dữ liệu trước khi đóng gói gửi cho C#
    const payload = {
      chapterId: this.selectedChapterId(),
      title: formVal.title!,
      type: typeNum,
      // Nếu là Video (0) hoặc Tự luận (3) thì nhét link vào videoUrl
      videoUrl: (typeNum === 0 || typeNum === 3) ? formVal.videoUrl : undefined,
      // Nếu là Tài liệu (1) thì nhét link vào documentUrl để C# không chửi
      documentUrl: typeNum === 1 ? formVal.videoUrl : undefined,
      sortOrder: formVal.sortOrder!
    };

    if (this.lessonModalMode() === 'add') {
      this.courseService.createLesson(payload).subscribe({
        next: () => { 
          this.loadCourseContent(this.courseId()); 
          this.isLessonModalOpen.set(false); 
        },
        error: (err) => alert('Lỗi: ' + (err.error?.message || err.message))
      });
    } else {
      this.courseService.updateLesson(this.selectedLessonId(), payload).subscribe({
        next: () => { 
          this.loadCourseContent(this.courseId()); 
          this.isLessonModalOpen.set(false); 
        },
        error: (err) => alert('Lỗi cập nhật Bài học: ' + (err.error?.message || err.message))
      });
    }
  }

  deleteLesson(lesson: Lesson, event: Event) {
    event.stopPropagation();
    if (confirm(`Bạn có chắc muốn xóa bài học "${lesson.title}" không?`)) {
      this.courseService.deleteLesson(lesson.id).subscribe({
        next: () => this.loadCourseContent(this.courseId()),
        error: (err) => alert('Lỗi xóa Bài học: ' + (err.error?.message || err.message))
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploading.set(true);

    this.courseService.uploadFile(file).subscribe({
      next: (response) => {
        // Bơm thẳng cái URL từ Cloudinary vào Form
        this.lessonForm.patchValue({ videoUrl: response.url });
        this.isUploading.set(false);
        // Reset ô input file để có thể chọn lại file khác nếu muốn
        input.value = ''; 
      },
      error: (err) => {
        alert('Lỗi Upload: ' + (err.error?.message || err.message));
        this.isUploading.set(false);
        input.value = '';
      }
    });
  }

  exportExcel(lessonId: string, lessonTitle: string, event: Event) {
    event.stopPropagation();
    
    // Đổi trạng thái hiển thị loading nếu cần...
    
    this.courseService.exportLessonScores(lessonId).subscribe({
      next: (blobData) => {
        // Tạo một URL ảo trỏ vào vùng nhớ chứa file
        const url = window.URL.createObjectURL(blobData);
        
        // Tạo một thẻ <a> ẩn để tự động bấm tải xuống
        const a = document.createElement('a');
        a.href = url;
        // Gắn tên bài học vào tên file tải về cho chuyên nghiệp
        a.download = `Bang_Diem_${lessonTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`; 
        document.body.appendChild(a);
        a.click();
        
        // Dọn rác
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(err);
        alert('Lỗi khi xuất file Excel từ máy chủ!');
      }
    });
  }
}