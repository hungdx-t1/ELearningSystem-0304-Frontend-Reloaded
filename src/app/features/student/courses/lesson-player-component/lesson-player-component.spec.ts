import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonPlayerComponent } from './lesson-player-component';

describe('LessonPlayerComponent', () => {
  let component: LessonPlayerComponent;
  let fixture: ComponentFixture<LessonPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonPlayerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
