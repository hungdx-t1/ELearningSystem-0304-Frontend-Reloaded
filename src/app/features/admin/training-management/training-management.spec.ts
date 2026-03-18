import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingManagement } from './training-management';

describe('TrainingManagement', () => {
  let component: TrainingManagement;
  let fixture: ComponentFixture<TrainingManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainingManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
