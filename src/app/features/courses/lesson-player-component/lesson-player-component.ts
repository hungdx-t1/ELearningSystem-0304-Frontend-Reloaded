import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-lesson-player-component',
  imports: [],
  templateUrl: './lesson-player-component.html',
  styleUrl: './lesson-player-component.scss',
})
export class LessonPlayerComponent implements OnInit {
  private route = inject(ActivatedRoute);

  // Dữ liệu bài học đang phát
  currentLesson = signal<any>(null);

  ngOnInit() {
    // TODO: Lấy ID từ URL để gọi API (vd: /lessons/123 -> lấy số 123)
    const lessonId = this.route.snapshot.paramMap.get('lessonId');

    // TODO: Tạm thời bơm dữ liệu giả để "lên đồ" giao diện
    this.currentLesson.set({
      id: lessonId || '1',
      title: 'Bài 1: Tổng quan về Hệ thống',
      type: 0, // 0: Video, 1: Document
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // Link video test có sẵn
      description: 'Trong bài học này, giảng viên sẽ giới thiệu tổng quan về cấu trúc của hệ thống, các thành phần chính và cách chúng tương tác với nhau.'
    });
  }
}
