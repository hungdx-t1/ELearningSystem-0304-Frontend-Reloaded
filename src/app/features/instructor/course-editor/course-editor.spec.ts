import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseEditor } from './course-editor';

describe('CourseEditor', () => {
  let component: CourseEditor;
  let fixture: ComponentFixture<CourseEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
