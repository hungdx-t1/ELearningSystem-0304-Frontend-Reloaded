import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizBuilder } from './quiz-builder';

describe('QuizBuilder', () => {
  let component: QuizBuilder;
  let fixture: ComponentFixture<QuizBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizBuilder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizBuilder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
