import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClassService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/classes`;

  getAllClasses(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createClass(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateClass(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteClass(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getClassDetails(classId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${classId}/details`);
  }

  // Thêm 1 sinh viên (ghi danh) - Dùng lại API enroll cũ của bạn
  enrollStudent(classId: string, studentId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${classId}/enroll`, { studentId: studentId });
  }

  // Lấy danh sách lớp của một Sinh viên
  getStudentClasses(studentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/student/${studentId}`);
  }

  // Import file Excel
  importStudentsExcel(classId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${classId}/import-students`, formData);
  }

  // Đuổi học
  removeStudent(classId: string, studentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${classId}/remove-student/${studentId}`);
  }
}
