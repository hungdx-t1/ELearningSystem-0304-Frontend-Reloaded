import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs'; // async/await với Observable
import { isPlatformBrowser } from '@angular/common';

export interface Course {
  id: string;
  title: string;
  description?: string;
  instructorId?: string;
  thumbnailUrl?: string;
  createdAt: string;
  creatorId?: string;
  creatorName?: string;
  isPublic: boolean; 
}

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  type: number; // 0: Video, 1: Document, 2: Quiz, 3: Assignment
  videoUrl?: string | null; 
  documentUrl?: string | null;
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
  private platformId = inject(PLATFORM_ID);
  
  private apiUrl = 'http://localhost:5189/api';

  getAllCourses() {
    if (!isPlatformBrowser(this.platformId)) { // Nếu không phải trên trình duyệt, trả về một Observable rỗng hoặc dữ liệu giả
      return of([]); 
    }
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
  createCourse(courseData: { title: string; description: string; thumbnailUrl: string; isPublic: boolean }) {
    return this.http.post<Course>(`${this.apiUrl}/courses`, courseData);
  }

  // Cập nhật khóa học
  updateCourse(id: string, courseData: any) {
    return this.http.put(`${this.apiUrl}/courses/${id}`, courseData);
  }

  // Xóa khóa học
  deleteCourse(id: string) {
    return this.http.delete(`${this.apiUrl}/courses/${id}`);
  }

  copyCourse(id: string) {
    return this.http.post<{ message: string; data: Course }>(`${this.apiUrl}/courses/${id}/copy`, {});
  }

  // Gửi lệnh tạo Chương mới
  createChapter(chapterData: { courseId: string; title: string; sortOrder: number }) {
    return this.http.post<Chapter>(`${this.apiUrl}/chapters`, chapterData);
  }
  
  updateChapter(id: string, chapterData: any) {
    return this.http.put(`${this.apiUrl}/chapters/${id}`, chapterData);
  }

  deleteChapter(id: string) {
    return this.http.delete(`${this.apiUrl}/chapters/${id}`);
  }

  createLesson(lessonData: { 
    chapterId: string; 
    title: string; 
    type: number; 
    videoUrl?: string | null;       // Cho phép null
    documentUrl?: string | null;    // Bổ sung thêm documentUrl
    sortOrder: number 
  }) {
    return this.http.post<Lesson>(`${this.apiUrl}/lessons`, lessonData);
  }

  updateLesson(id: string, lessonData: any) {
    return this.http.put(`${this.apiUrl}/lessons/${id}`, lessonData);
  }

  deleteLesson(id: string) {
    return this.http.delete(`${this.apiUrl}/lessons/${id}`);
  }

  // --- API Upload --
  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string; url: string }>(`${this.apiUrl}/files/upload`, formData);
  }

  // Lấy danh sách Bài tập tự luận của 1 khóa học (để thả vào Dropdown)
  getAssignmentsByCourse(courseId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/courses/${courseId}/assignments`);
  }

  exportLessonScores(lessonId: string) {
    return this.http.get(`${this.apiUrl}/submissions/lesson/${lessonId}/export`, { 
      responseType: 'blob' 
    });
  }
}