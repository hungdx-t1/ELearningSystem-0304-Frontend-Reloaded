import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionHistory } from './submission-history';

describe('SubmissionHistory', () => {
  let component: SubmissionHistory;
  let fixture: ComponentFixture<SubmissionHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmissionHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
