import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.html'
})
export class AdminDashboard {
  // 4 Chỉ số KPI quan trọng nhất
  kpis = signal([
    { title: 'Tổng Học viên', value: '1,204', trend: '+12%', isUp: true, icon: '👨‍🎓', color: 'bg-blue-50 text-blue-600' },
    { title: 'Khóa học Đang mở', value: '45', trend: '+5', isUp: true, icon: '📚', color: 'bg-indigo-50 text-indigo-600' },
    { title: 'Lớp học Đang chạy', value: '28', trend: '-2', isUp: false, icon: '🏫', color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Doanh thu (Giả định)', value: '125Tr', trend: '+18%', isUp: true, icon: '💰', color: 'bg-rose-50 text-rose-600' }
  ]);

  // Dữ liệu cho biểu đồ cột (6 tháng gần nhất)
  chartData = signal([
    { label: 'Tháng 10', value: 40, height: 'h-24' },
    { label: 'Tháng 11', value: 65, height: 'h-40' },
    { label: 'Tháng 12', value: 45, height: 'h-28' },
    { label: 'Tháng 1', value: 90, height: 'h-56' },
    { label: 'Tháng 2', value: 75, height: 'h-48' },
    { label: 'Tháng 3', value: 110, height: 'h-64' } // Tháng hiện tại cao vút
  ]);

  // Hoạt động gần đây
  recentActivities = signal([
    { user: 'Nguyễn Văn A', action: 'vừa đăng ký khóa học', target: 'Lập trình Web', time: '5 phút trước' },
    { user: 'Giảng viên Trần B', action: 'vừa tạo lớp học mới', target: 'L01 - Kiến trúc PM', time: '1 giờ trước' },
    { user: 'Quản trị viên', action: 'vừa xuất file Excel', target: 'Danh sách Sinh viên', time: '3 giờ trước' },
  ]);
}