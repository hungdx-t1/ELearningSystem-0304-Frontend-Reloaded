import { Component } from '@angular/core';

@Component({
  selector: 'app-class-list-component',
  imports: [],
  templateUrl: './class-list-component.html',
  styleUrl: './class-list-component.scss',
})
export class ClassListComponent {
  // Tạo dữ liệu giả (Mock data) để "bơm" vào giao diện
  dummyClasses = [
    { id: 1, name: 'Lập trình Web nâng cao', teacher: 'Thầy A', schedule: 'Thứ 2, 4, 6 (Ca 1)' },
    { id: 2, name: 'Kiến trúc Phần mềm', teacher: 'Cô B', schedule: 'Thứ 3, 5 (Ca 3)' },
    { id: 3, name: 'Trí tuệ Nhân tạo', teacher: 'Thầy C', schedule: 'Thứ 7 (Ca 2)' }
  ];
}