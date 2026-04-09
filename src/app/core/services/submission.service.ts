import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Submission {
  id: string;
  lessonId: string;
  classId: string;
  studentId: string;
  submissionUrl?: string;
  studentNote?: string;
  submittedAt: string;
  score?: number;
  feedback?: string;

  quizAnswersJson?: string;
  cheatWarnings?: number;
  isSubmitted?: boolean;
  
  // todo backend trả về thêm thông tin sinh viên (có thể dùng join fetch hoặc gọi thêm api lấy thông tin sinh viên)
  studentName?: string; 
  studentCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5189/api/submissions';

  // Lấy danh sách bài nộp
  getSubmissions(classId: string, lessonId: string): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${this.apiUrl}/class/${classId}/lesson/${lessonId}`);
  }

  // Lấy bài nộp CỦA RIÊNG 1 SINH VIÊN (Dành cho màn hình học tập)
  getSubmissionAsync(classId: string, lessonId: string, studentId: string): Observable<Submission> {
    return this.http.get<Submission>(`${this.apiUrl}/class/${classId}/lesson/${lessonId}/student/${studentId}`);
  }

  // Sinh viên nộp bài
  submitWork(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit`, data);
  }

  // Giảng viên chấm điểm
  gradeSubmission(id: string, score: number, feedback: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/grade`, { score, feedback });
  }

  // Sinh viên nộp bài trắc nghiệm (Lưu điểm)
  submitQuiz(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit-quiz`, data);
  }
}