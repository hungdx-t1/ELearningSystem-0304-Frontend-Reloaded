import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5189/api/ai'; 

  // Gọi API sinh câu hỏi trắc nghiệm
  generateQuiz(topic: string, questionCount: number): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/generate-quiz`, { topic, questionCount });
  }
}