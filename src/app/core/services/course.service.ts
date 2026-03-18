import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs'; // async/await với Observable

export interface Course {
  id: string;
  title: string;
  description?: string;
  instructorId?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  type: number; // 0: Video, 1: Document, 2: Quiz
  videoUrl?: string;
  duration?: number;
  sortOrder: number;
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  sortOrder: number;
  lessons?: Lesson[]; // Chứa danh sách bài học của chương này
  isExpanded?: boolean; // Trạng thái đóng/mở trên giao diện
}

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5189/api';

  getAllCourses() {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`);
  }

  getCourseById(id: string) {
    return firstValueFrom(this.http.get<Course>(`${this.apiUrl}/courses/${id}`));
  }

  getChaptersByCourseId(courseId: string) {
    return firstValueFrom(this.http.get<Chapter[]>(`${this.apiUrl}/chapters/course/${courseId}`));
  }

  getLessonsByChapterId(chapterId: string) {
    return firstValueFrom(this.http.get<Lesson[]>(`${this.apiUrl}/lessons/chapter/${chapterId}`));
  }

  //gửi dữ liệu tạo khóa học mới xuống BE
  createCourse(courseData: { title: string; description: string; thumbnailUrl: string }) {
    return this.http.post<Course>(`${this.apiUrl}/courses`, courseData);
  }
}