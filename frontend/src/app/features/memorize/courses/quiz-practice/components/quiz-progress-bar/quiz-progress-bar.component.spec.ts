import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuizProgressBarComponent } from './quiz-progress-bar.component';

describe('QuizProgressBarComponent', () => {
  let component: QuizProgressBarComponent;
  let fixture: ComponentFixture<QuizProgressBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizProgressBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
