import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DashboardService, DashboardData } from '../../../core/services/dashboard.service';
import { NotificationService } from '../../../../v2/app/core/services/notification.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe], // format ngày tháng
  templateUrl: './admin-dashboard.html'
})
export class AdminDashboard implements OnInit {
  private dashboardService = inject(DashboardService);

  private notiService = inject(NotificationService);

  today = new Date(); // Lấy ngày tự động thay vì gõ cứng
  isLoading = signal<boolean>(true);

  kpis = signal<any[]>([]);
  chartData = signal<any[]>([]);
  recentActivities = signal<any[]>([]);

  // Tính toán chiều cao linh hoạt cho biểu đồ (Phần tử cao nhất sẽ full 100% cột)
  maxChartValue = computed(() => {
    const data = this.chartData();
    if (data.length === 0) return 1;
    return Math.max(...data.map(d => d.value)) || 1; // Tránh chia cho 0
  });

  ngOnInit() {
    this.dashboardService.getAdminDashboard().subscribe({
      next: (data: DashboardData) => {
        this.kpis.set(data.kpis);
        this.chartData.set(data.chartData);
        this.recentActivities.set(data.recentActivities);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi lấy dữ liệu Dashboard:', err);
        this.isLoading.set(false);
      }
    });
  }
}