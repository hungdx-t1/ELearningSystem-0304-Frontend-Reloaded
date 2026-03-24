import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { SubmissionService } from '../../../core/services/submission.service';
import { ClassService } from '../../../core/services/class.service';
import { CourseService } from '../../../core/services/course.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-assignment-grading',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './assignment-grading.html'
})
export class AssignmentGrading implements OnInit {
  private fb = inject(FormBuilder);
  
  private submissionService = inject(SubmissionService);
  private classService = inject(ClassService);
  private courseService = inject(CourseService);
  private userService = inject(UserService);

  classes = signal<any[]>([]);
  allLessons = signal<any[]>([]);
  
  selectedClassId = signal<string>('');
  selectedLessonId = signal<string>('');

  // Lọc ra các Lesson thuộc Course của cái Lớp đang chọn
  filteredLessons = computed(() => {
    const classId = this.selectedClassId();
    if (!classId) return [];
    
    // Tìm xem lớp này thuộc khóa học (CourseId) nào
    const selectedClass = this.classes().find(c => c.id === classId);
    if (!selectedClass) return [];

    // Chỉ lấy những Bài học có type === 3 (Tự luận) và thuộc về CourseId đó
    return this.allLessons().filter(l => l.courseId === selectedClass.courseId && l.type === 3);
  });

  // Giả lập dữ liệu bài nộp của Sinh viên
  submissions = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  // Quản lý Modal chấm bài
  isGradingModalOpen = signal<boolean>(false);
  selectedSubmission = signal<any>(null);

  gradingForm = this.fb.group({
    score: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
    feedback: ['', Validators.required]
  });

  ngOnInit() {
    this.loadInitialData();
  }

  async loadInitialData() {
    // Kéo danh sách Lớp học về để đổ vào Dropdown 1
    this.classService.getAllClasses().subscribe({
      next: (data) => this.classes.set(data)
    });

    // Kéo MỌI Chương, Bài học về (Hơi tốn tài nguyên tí nhưng tiện để lọc)
    // Ở hệ thống thật, bạn nên gọi API: GET /api/lessons/type/3/course/{id}
    // Tạm thời để đơn giản, mình giả định bạn có 1 hàm getAllLessons() trong CourseService
    try {
       // CẦN BỔ SUNG: Hàm getAllLessons() ở CourseService bên Angular
       // Trả về danh sách Lesson có đính kèm thêm courseId
    } catch (error) {
       console.log("Cần bổ sung API lấy tất cả Lessons");
    }
  }

  // Chạy khi Giảng viên bấm nút "Lọc dữ liệu"
  loadSubmissions() {
    const cId = this.selectedClassId();
    const lId = this.selectedLessonId();

    if (!cId || !lId) {
      alert('Vui lòng chọn cả Lớp học và Bài tập để lọc!');
      return;
    }

    this.isLoading.set(true);
    
    this.submissionService.getSubmissions(cId, lId).subscribe({
      next: async (data) => {
        // C# hiện tại chỉ trả về StudentId. Chúng ta cần kéo tên Sinh viên về.
        // có thể gọi API userService lấy tên, hoặc nhờ BE C# Join bảng trả về luôn.
        // Tạm thời map data để hiển thị.
        const mappedData = data.map((s: any) => ({
          ...s,
          studentName: 'Sinh viên ' + s.studentId.substring(0, 5), // Giả lập tên
          studentCode: s.studentId,
          content: s.studentNote, // Ánh xạ từ DB
          fileUrl: s.submissionUrl,
          status: s.score !== null ? 'Graded' : 'Pending'
        }));

        this.submissions.set(mappedData);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi lấy bài nộp', err);
        this.isLoading.set(false);
      }
    });
  }

  openGradingModal(sub: any) {
    this.selectedSubmission.set(sub);
    this.gradingForm.patchValue({
      score: sub.score || 0,
      feedback: sub.feedback || ''
    });
    this.isGradingModalOpen.set(true);
  }

  closeModal() {
    this.isGradingModalOpen.set(false);
    this.selectedSubmission.set(null);
  }

  submitGrade() {
    if (this.gradingForm.invalid) {
      this.gradingForm.markAllAsTouched();
      return;
    }

    const payload = this.gradingForm.value;
    const subId = this.selectedSubmission().id;

    this.submissionService.gradeSubmission(subId, payload.score!, payload.feedback!).subscribe({
      next: () => {
        // Cập nhật điểm trên màn hình ngay lập tức (không cần load lại toàn bộ danh sách)
        this.submissions.update(list => list.map(s => {
          if (s.id === subId) {
            return { ...s, score: payload.score, feedback: payload.feedback, status: 'Graded' };
          }
          return s;
        }));

        alert('Đã lưu điểm và nhận xét thành công!');
        this.closeModal();
      },
      error: (err) => alert('Lỗi chấm điểm: ' + (err.error?.message || err.message))
    });
  }
}