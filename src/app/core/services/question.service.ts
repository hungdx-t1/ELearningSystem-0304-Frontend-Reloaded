import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Question {
  id?: string;
  lessonId: string;
  content: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/questions`;

  getQuestionsByLessonId(lessonId: string): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/lesson/${lessonId}`);
  }

  createQuestion(question: any): Observable<Question> {
    return this.http.post<Question>(this.apiUrl, question);
  }

  updateQuestion(id: string, question: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, question);
  }

  deleteQuestion(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}