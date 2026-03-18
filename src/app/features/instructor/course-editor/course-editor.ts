import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService, Course, Chapter } from '../../../core/services/course.service';
import { FormsModule } from '@angular/forms'; // Bắt buộc phải có để xài ngModel

@Component({
  selector: 'app-course-editor',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './course-editor.html'
})
export class CourseEditor implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);

  course = signal<Course | null>(null);
  chapters = signal<Chapter[]>([]);
  isLoading = signal<boolean>(true);

  // Biến lưu trữ giá trị ô nhập liệu mới
  newChapterTitle = signal('');

  async ngOnInit() {
    this.loadCourseData();
  }

  async loadCourseData() {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (!courseId) return;

    try {
      this.isLoading.set(true);
      const courseData = await this.courseService.getCourseById(courseId);
      this.course.set(courseData);

      const chaptersData = await this.courseService.getChaptersByCourseId(courseId);
      for (let chapter of chaptersData) {
        chapter.lessons = await this.courseService.getLessonsByChapterId(chapter.id);
        chapter.isExpanded = true;
      }
      this.chapters.set(chaptersData);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Hàm tạo Chương mới
  addChapter() {
    const title = this.newChapterTitle().trim();
    const courseId = this.course()?.id;
    if (!title || !courseId) return;

    const newSortOrder = this.chapters().length + 1; // Tự tính số thứ tự

    this.courseService.createChapter({ courseId, title, sortOrder: newSortOrder }).subscribe({
      next: () => {
        this.newChapterTitle.set(''); // Xóa trắng ô nhập
        this.loadCourseData(); // Load lại danh sách cho mới
      },
      error: (err) => alert('Lỗi khi tạo Chương mới!')
    });
  }

  // Hàm tạo Bài học mới (Sử dụng prompt của trình duyệt cho nhanh & ngầu)
  addLesson(chapterId: string, currentLessonsCount: number) {
    const title = prompt('Nhập tên bài học mới (VD: Bài 1: Cài đặt phần mềm):');
    if (!title) return;

    const videoUrl = prompt('Nhập link Video (VD: https://youtube.com/...):') || '';
    const newSortOrder = currentLessonsCount + 1;

    this.courseService.createLesson({
      chapterId,
      title,
      type: 0, // Mặc định là Video
      videoUrl,
      sortOrder: newSortOrder
    }).subscribe({
      next: () => this.loadCourseData(), // Tải lại giao diện
      error: (err) => alert('Lỗi khi tạo Bài học!')
    });
  }

  toggleChapter(chapter: Chapter) {
    chapter.isExpanded = !chapter.isExpanded;
    this.chapters.set([...this.chapters()]);
  }
}