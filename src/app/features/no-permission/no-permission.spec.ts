import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoPermission } from './no-permission';

describe('NoPermission', () => {
  let component: NoPermission;
  let fixture: ComponentFixture<NoPermission>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoPermission]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoPermission);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
