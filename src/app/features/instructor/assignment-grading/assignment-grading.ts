import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { SubmissionService } from '../../../core/services/submission.service';
import { ClassService } from '../../../core/services/class.service';
import { CourseService } from '../../../core/services/course.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../../v2/app/core/services/notification.service';

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

  private notiService = inject(NotificationService);

  classes = signal<any[]>([]);
  assignments = signal<any[]>([]);
  allLessons = signal<any[]>([]);
  
  // DỮ LIỆU ĐỂ MAP TÊN SINH VIÊN
  users = signal<any[]>([]);
  
  selectedClassId = signal<string>('');
  selectedLessonId = signal<string>('');

  onClassChange(event: Event) {
    const classId = (event.target as HTMLSelectElement).value;
    this.selectedClassId.set(classId);
    
    this.selectedLessonId.set('');
    this.assignments.set([]);
    this.submissions.set([]); 

    if (!classId) return;

    const selectedClass = this.classes().find(c => c.id === classId);
    if (selectedClass && selectedClass.courseId) {
      this.courseService.getAssignmentsByCourse(selectedClass.courseId).subscribe({
        next: (data) => this.assignments.set(data),
        error: (err) => console.error('Lỗi tải bài tập:', err)
      });
    }
  }

  filteredLessons = computed(() => {
    const classId = this.selectedClassId();
    if (!classId) return [];
    
    const selectedClass = this.classes().find(c => c.id === classId);
    if (!selectedClass) return [];

    return this.allLessons().filter(l => l.courseId === selectedClass.courseId && l.type === 3);
  });

  submissions = signal<any[]>([]);
  isLoading = signal<boolean>(false);

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
    // 1. Kéo danh sách Lớp học
    this.classService.getAllClasses().subscribe({
      next: (data) => this.classes.set(data)
    });

    // 2. Kéo toàn bộ User về để dành (Để lát tra cứu tên Sinh viên)
    this.userService.getAllUsers().subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('Lỗi tải danh sách users:', err)
    });

    try {
       // TODO: Bổ sung getAllLessons nếu cần ở tương lai
    } catch (error) {
       console.log("Cần bổ sung API lấy tất cả Lessons");
    }
  }

  loadSubmissions() {
    const cId = this.selectedClassId();
    const lId = this.selectedLessonId();

    if (!cId || !lId) {
      this.notiService.error('Vui lòng chọn cả Lớp học và Bài tập để lọc!');
      return;
    }

    this.isLoading.set(true);
    
    this.submissionService.getSubmissions(cId, lId).subscribe({
      next: (data) => {
        const userList = this.users(); // Lấy danh sách user đã tải sẵn

        // MAP ID THÀNH TÊN THẬT
        const mappedData = data.map((s: any) => {
          // Đi tìm sinh viên có cái ID khớp với cái bài nộp
          const student = userList.find(u => u.id === s.studentId);

          return {
            ...s,
            // Nếu tìm thấy thì ghép Tên thật, không thì để 'Ẩn danh'
            studentName: student ? student.fullName : 'Sinh viên ẩn danh', 
            // Nếu tìm thấy thì ghép Mã SV (hoặc Email nếu chưa có mã)
            studentCode: student ? (student.userCode || student.email) : s.studentId.substring(0, 8),
            content: s.studentNote, 
            fileUrl: s.submissionUrl,
            status: s.score !== null ? 'Graded' : 'Pending'
          };
        });

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
        this.submissions.update(list => list.map(s => {
          if (s.id === subId) {
            return { ...s, score: payload.score, feedback: payload.feedback, status: 'Graded' };
          }
          return s;
        }));

        this.notiService.success('Đã lưu điểm và nhận xét thành công!');
        this.closeModal();
      },
      error: (err) => this.notiService.error('Lỗi chấm điểm: ' + (err.error?.message || err.message))
    });
  }
}