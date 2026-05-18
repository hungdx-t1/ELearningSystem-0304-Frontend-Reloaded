import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardData {
  kpis: any[];
  chartData: any[];
  recentActivities: any[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  
  getAdminDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${environment.apiUrl}/admin/dashboard`);
  }

  getStudentDashboard(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/dashboard/student`);
  }
}