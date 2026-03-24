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
  
  // có thể nhờ C# trả thêm tên Sinh Viên, nếu không có thì lát mình sẽ tự ghép
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

  // Sinh viên nộp bài
  submitWork(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit`, data);
  }

  // Giảng viên chấm điểm
  gradeSubmission(id: string, score: number, feedback: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/grade`, { score, feedback });
  }
}