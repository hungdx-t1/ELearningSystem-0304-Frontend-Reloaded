import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ai`; 

  sendMessage(prompt: string, lessonIds: string[], file: File | null): Observable<{ reply: string }> {
    const formData = new FormData();
    formData.append('prompt', prompt);
    
    if (file) {
      formData.append('file', file);
    }

    if (lessonIds && lessonIds.length > 0) {
      lessonIds.forEach(id => formData.append('lessonIds', id));
    }

    return this.http.post<{ reply: string }>(`${this.apiUrl}/chat`, formData);
  }

  generateQuiz(topic: string, questionCount: number, lessonIds: string[], file: File | null): Observable<any[]> {
    const formData = new FormData();
    formData.append('topic', topic || ''); 
    formData.append('questionCount', questionCount.toString());

    if (file) {
      formData.append('file', file);
    }

    if (lessonIds && lessonIds.length > 0) {
      lessonIds.forEach(id => formData.append('lessonIds', id)); // mảng id bài học
    }
    
    return this.http.post<any[]>(`${this.apiUrl}/generate-quiz`, formData);
  }
}