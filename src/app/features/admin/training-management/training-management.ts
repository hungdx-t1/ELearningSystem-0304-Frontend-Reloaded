import { SlicePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-training-management',
  standalone: true,
  imports: [FormsModule, SlicePipe],
  templateUrl: './training-management.html'
})
export class TrainingManagement {
  // Dữ liệu giả lập danh sách lớp học
  classes = signal([
    { id: 1, name: 'Lập trình Web nâng cao - L01', course: 'Lập trình Web', instructor: 'Trần Thị B', students: 45, maxStudents: 50, status: 'Đang diễn ra' },
    { id: 2, name: 'Kiến trúc phần mềm - L02', course: 'Kiến trúc phần mềm', instructor: 'Chưa phân công', students: 0, maxStudents: 40, status: 'Sắp mở' },
    { id: 3, name: 'Trí tuệ Nhân tạo - L01', course: 'AI Căn bản', instructor: 'Lê Văn D', students: 60, maxStudents: 60, status: 'Đã đầy' }
  ]);

  // Trạng thái hiển thị Form tạo lớp
  isCreating = signal<boolean>(false);

  // Biến lưu dữ liệu lớp mới đang nhập
  newClass = signal({ name: '', course: '', instructor: '', maxStudents: 30 });

  toggleCreateForm() {
    this.isCreating.set(!this.isCreating());
  }

  saveClass() {
    const data = this.newClass();
    if (!data.name || !data.course) {
      alert('Vui lòng nhập đủ Tên lớp và Môn học!');
      return;
    }

    // TODO: Tương lai sẽ gọi API POST /api/classes ở đây
    alert(`Đã lưu lớp học: ${data.name}. Hệ thống sẽ sớm kết nối API!`);
    
    // Reset form và đóng lại
    this.newClass.set({ name: '', course: '', instructor: '', maxStudents: 30 });
    this.isCreating.set(false);
  }
}