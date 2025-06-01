// frontend/src/app/features/home/home.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Feature {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  benefits: string[];
  route: string;
  color: string;
}

interface Testimonial {
  text: string;
  author: string;
  role: string;
  rating: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  features: Feature[] = [
    {
      title: 'Bible Tracker',
      subtitle: 'Visual Progress Tracking',
      description: 'Track your scripture memorization journey with an intuitive visual interface. See your progress through every book, chapter, and verse of the Bible.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>`,
      benefits: [
        'Track all 31,102 verses across 66 books',
        'Visual progress indicators for books and chapters',
        'Bulk selection tools for efficient tracking',
        'Support for apocryphal texts'
      ],
      route: '/tracker',
      color: '#3b82f6'
    },
    {
      title: 'FLOW Method',
      subtitle: 'First Letter Of Word Technique',
      description: 'Master scripture memorization using our proven FLOW method. This cognitive technique helps you memorize passages by focusing on the first letter of each word.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>`,
      benefits: [
        'Scientifically proven memorization technique',
        'Flexible verse range selection (10-80 verses)',
        'Grid and single-column view options',
        'Confidence tracking and progress saving'
      ],
      route: '/flow',
      color: '#10b981'
    },
    {
      title: 'Smart Flashcards',
      subtitle: 'Spaced Repetition Learning',
      description: 'Create custom flashcard decks for effective scripture memorization. Our smart system uses spaced repetition to optimize your learning.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>`,
      benefits: [
        'Create unlimited custom decks',
        'Share decks with the community',
        'Smart review scheduling',
        'Track confidence levels per verse'
      ],
      route: '/flashcard',
      color: '#f59e0b'
    },
    {
      title: 'Progress Analytics',
      subtitle: 'Insightful Statistics',
      description: 'Gain deep insights into your memorization journey with comprehensive analytics and beautiful visualizations.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zM13 19v-9a2 2 0 00-2-2H9a2 2 0 00-2 2v9a2 2 0 002 2h2a2 2 0 002-2zM21 19v-3a2 2 0 00-2-2h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2z" />
      </svg>`,
      benefits: [
        'Daily activity tracking',
        'Book completion heatmaps',
        'Streak tracking and goals',
        'Export your progress data'
      ],
      route: '/stats',
      color: '#8b5cf6'
    }
  ];

  testimonials: Testimonial[] = [
    {
      text: "Well Versed transformed my scripture memorization. The FLOW method helped me memorize entire chapters in weeks!",
      author: "Sarah Mitchell",
      role: "Bible Study Leader",
      rating: 5
    },
    {
      text: "The visual tracking system keeps me motivated. I love seeing my progress across the entire Bible.",
      author: "David Chen",
      role: "Seminary Student",
      rating: 5
    },
    {
      text: "Creating and sharing flashcard decks with my study group has made memorization fun and collaborative.",
      author: "Maria Garcia",
      role: "Youth Pastor",
      rating: 5
    }
  ];

  stats = [
    { value: '31,102', label: 'Total Verses', icon: '📖' },
    { value: '1,189', label: 'Chapters', icon: '📑' },
    { value: '66', label: 'Books', icon: '📚' },
    { value: '100%', label: 'Free Forever', icon: '✨' }
  ];

  scrollToFeatures() {
    const element = document.getElementById('features-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}