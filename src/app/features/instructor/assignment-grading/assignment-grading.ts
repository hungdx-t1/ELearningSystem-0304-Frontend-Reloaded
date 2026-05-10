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
    this.classService.getAllClasses().subscribe({
      next: (data) => this.classes.set(data)
    });
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
        const mappedData = data.map((s: any) => ({
            ...s,
            // 🌟 LỚP BẢO HIỂM: 
            // Bắt cả camelCase (studentName), PascalCase (StudentName) và chuỗi rỗng ("")
            studentName: s.studentName || s.StudentName || 'Sinh viên ẩn danh',
            
            studentCode: s.studentCode || s.StudentCode || (s.studentId ? String(s.studentId).substring(0, 8) : 'Không xác định'),
            
            content: s.studentNote, 
            fileUrl: s.submissionUrl,
            status: s.score !== null ? 'Graded' : 'Pending'
        }));

        this.submissions.set(mappedData);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi lấy bài nộp', err);
        this.notiService.error('Không thể tải danh sách bài nộp.');
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
      this.notiService.error('Vui lòng kiểm tra lại điểm số hoặc nhận xét hợp lệ!');
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