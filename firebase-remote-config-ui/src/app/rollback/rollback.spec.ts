import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rollback } from './rollback';

describe('Rollback', () => {
  let component: Rollback;
  let fixture: ComponentFixture<Rollback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rollback]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rollback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
