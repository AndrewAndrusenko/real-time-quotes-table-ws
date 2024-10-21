import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestingPanelComponent } from './testing-panel.component';

describe('TestingPanelComponent', () => {
  let component: TestingPanelComponent;
  let fixture: ComponentFixture<TestingPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestingPanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestingPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
