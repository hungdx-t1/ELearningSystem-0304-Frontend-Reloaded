import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService, Course, Chapter } from '../../../core/services/course.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-course-detail-component',
  imports: [RouterLink],
  templateUrl: './course-detail-component.html',
  styleUrl: './course-detail-component.scss',
  animations: [
    trigger('slideInOut', [
      state('collapsed', style({ height: '0px', minHeight: '0', opacity: 0, overflow: 'hidden' })), // Trạng thái đóng: h=0
      state('expanded', style({ height: '*', opacity: 1 })), // Trạng thái mở: h tự động tính
      transition('expanded <=> collapsed', animate('300ms ease-in-out')) // Thời gian trượt 300ms
    ])
  ]
})
export class CourseDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);

  // Quản lý trạng thái bằng Signal
  course = signal<Course | null>(null);
  chapters = signal<Chapter[]>([]);
  isLoading = signal<boolean>(true);

  async ngOnInit() {
    // 1. Lấy cái ID từ trên thanh địa chỉ (ví dụ: /courses/123 -> lấy số 123)
    const courseId = this.route.snapshot.paramMap.get('id');
    
    if (courseId) {
      try {
        // 2. Kéo dữ liệu Khóa học
        const courseData = await this.courseService.getCourseById(courseId);
        this.course.set(courseData);

        // 3. Kéo danh sách Chương
        const chaptersData = await this.courseService.getChaptersByCourseId(courseId);
        
        // 4. Lấy Bài học cho từng Chương (Chạy song song cho nhanh)
        for (let chapter of chaptersData) {
          chapter.lessons = await this.courseService.getLessonsByChapterId(chapter.id);
          chapter.isExpanded = true; // Mặc định mở hết các chương ra cho đẹp
        }
        
        this.chapters.set(chaptersData);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  // Hàm bật/tắt đóng mở Chương (Accordion)
  toggleChapter(chapter: Chapter) {
    chapter.isExpanded = !chapter.isExpanded;
    // Cập nhật lại Signal để giao diện vẽ lại
    this.chapters.set([...this.chapters()]); 
  }
}