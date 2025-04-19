import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FlowMemorizationComponent} from './flow-memorization.component';

describe('FlowMemorizationComponent', () => {
  let component: FlowMemorizationComponent;
  let fixture: ComponentFixture<FlowMemorizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlowMemorizationComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FlowMemorizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
