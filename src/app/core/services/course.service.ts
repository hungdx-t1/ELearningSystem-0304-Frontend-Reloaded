import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Course {
  id: string;
  title: string;
  description?: string;
  instructorId?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5189/api/courses';

  // Hàm gọi API lấy toàn bộ danh sách khóa học
  getAllCourses() {
    return this.http.get<Course[]>(this.apiUrl);
  }
}