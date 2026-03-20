import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminClassManagement } from './class-management';

describe('AdminClassManagement', () => {
  let component: AdminClassManagement;
  let fixture: ComponentFixture<AdminClassManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminClassManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminClassManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
