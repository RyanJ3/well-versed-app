// src/app/home/home.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container">
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Welcome to <span class="app-name">Well Versed</span></h1>
          <p class="hero-subtitle">Master scripture memorization with our powerful tools</p>
          <div class="cta-buttons">
            <a routerLink="/flow" class="cta-button primary">Try FLOW Method</a>
            <a routerLink="/flashcard" class="cta-button secondary">Use Flashcards</a>
          </div>
        </div>
      </section>

      <section class="features-section">
        <h2 class="section-title">Our Scripture Memorization Tools</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 class="feature-title">Bible Tracker</h3>
            <p class="feature-description">Track your progress through every book of the Bible with our visualization tools.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <h3 class="feature-title">FLOW Method</h3>
            <p class="feature-description">First Letter Of Word technique helps you memorize scripture efficiently and effectively.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 class="feature-title">Flashcards</h3>
            <p class="feature-description">Spaced repetition flashcards help reinforce scripture memory for long-term retention.</p>
          </div>
        </div>
      </section>

      <section class="stats-section">
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-number">66</div>
            <div class="stat-label">Books</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">1,189</div>
            <div class="stat-label">Chapters</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">31,102</div>
            <div class="stat-label">Verses</div>
          </div>
        </div>
        <p class="stats-caption">Track your progress through the entire Bible with our tools</p>
      </section>

      <section class="testimonials-section">
        <h2 class="section-title">What Users Say</h2>
        <div class="testimonial-card">
          <div class="testimonial-text">
            "Well Versed has completely transformed my approach to memorizing scripture. The FLOW method made it possible for me to memorize entire chapters!"
          </div>
          <div class="testimonial-author">— Sarah K.</div>
        </div>
      </section>

      <section class="cta-section">
        <h2 class="section-title">Ready to Get Started?</h2>
        <p class="cta-text">Begin your journey of scripture memorization today!</p>
        <div class="cta-buttons">
          <a routerLink="/" class="cta-button primary">Start Tracking</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Hero Section */
    .hero-section {
      padding: 4rem 0;
      text-align: center;
      background: linear-gradient(to right, #e6f2ff, #f0f7ff);
      border-radius: 12px;
      margin-bottom: 3rem;
    }

    .hero-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #1e3a8a;
    }

    .app-name {
      background: linear-gradient(90deg, #1e3a8a, #3b82f6);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: #4b5563;
      margin-bottom: 2rem;
    }

    /* Features Section */
    .features-section {
      margin-bottom: 3rem;
    }

    .section-title {
      text-align: center;
      font-size: 1.75rem;
      font-weight: 600;
      margin-bottom: 2rem;
      color: #1e3a8a;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .feature-card {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    }

    .feature-icon {
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      color: #3b82f6;
    }

    .feature-icon svg {
      width: 2rem;
      height: 2rem;
    }

    .feature-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #1f2937;
    }

    .feature-description {
      color: #6b7280;
      line-height: 1.5;
    }

    /* Stats Section */
    .stats-section {
      background-color: white;
      padding: 3rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      margin-bottom: 3rem;
      text-align: center;
    }

    .stats-container {
      display: flex;
      justify-content: space-around;
      margin-bottom: 1.5rem;
    }

    .stat-item {
      padding: 1rem;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 1rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .stats-caption {
      color: #4b5563;
      font-size: 1.1rem;
    }

    /* Testimonials Section */
    .testimonials-section {
      margin-bottom: 3rem;
    }

    .testimonial-card {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      position: relative;
    }

    .testimonial-card::before {
      content: '"';
      position: absolute;
      top: 1rem;
      left: 1rem;
      font-size: 5rem;
      color: #e5e7eb;
      font-family: serif;
      line-height: 1;
      z-index: 0;
    }

    .testimonial-text {
      position: relative;
      font-size: 1.1rem;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      z-index: 1;
    }

    .testimonial-author {
      font-weight: 600;
      color: #1f2937;
      text-align: right;
    }

    /* CTA Section */
    .cta-section {
      background: linear-gradient(to right, #dbeafe, #eff6ff);
      padding: 3rem;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 3rem;
    }

    .cta-text {
      font-size: 1.1rem;
      color: #4b5563;
      margin-bottom: 2rem;
    }

    /* Buttons */
    .cta-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .cta-button {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .cta-button.primary {
      background-color: #3b82f6;
      color: white;
    }

    .cta-button.primary:hover {
      background-color: #2563eb;
      transform: translateY(-2px);
    }

    .cta-button.secondary {
      background-color: white;
      color: #3b82f6;
      border: 1px solid #3b82f6;
    }

    .cta-button.secondary:hover {
      background-color: #f0f7ff;
      transform: translateY(-2px);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .hero-title {
        font-size: 2rem;
      }

      .stats-container {
        flex-direction: column;
      }

      .cta-buttons {
        flex-direction: column;
      }

      .cta-button {
        width: 100%;
        margin-bottom: 0.5rem;
      }
    }
  `]
})
export class HomeComponent {}
