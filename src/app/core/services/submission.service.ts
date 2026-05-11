import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  startedAt?: string;
  
  // todo backend trả về thêm thông tin sinh viên (có thể dùng join fetch hoặc gọi thêm api lấy thông tin sinh viên)
  studentName?: string; 
  studentCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/submissions`;

  // Lấy danh sách bài nộp
  getSubmissions(classId: string, lessonId: string): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${this.apiUrl}/class/${classId}/lesson/${lessonId}`);
  }

  // Lấy bài nộp CỦA RIÊNG 1 SINH VIÊN (Dành cho màn hình học tập)
  getSubmissionAsync(classId: string, lessonId: string, studentId: string): Observable<Submission> {
    return this.http.get<Submission>(`${this.apiUrl}/class/${classId}/lesson/${lessonId}/student/${studentId}`);
  }

  // Lấy toàn bộ lịch sử bài nộp của Sinh viên đang đăng nhập
  getStudentHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/student/history`);
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

  startExam(classId: string, lessonId: string) {
    return this.http.post<any>(`${this.apiUrl}/class/${classId}/lesson/${lessonId}/start-exam`, {});
  }

}