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
      subtitle: 'Visual Progress',
      description: 'Watch each book fill up 📖',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>`,
      benefits: [
        '31k verses mapped',
        'Bulk tools ⚡',
        'Apocrypha ready'
      ],
      route: '/tracker',
      color: '#3b82f6'
    },
    {
      title: 'FLOW Method',
      subtitle: 'First Letter Hints',
      description: 'Recall long passages 📝',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>`,
      benefits: [
        '10-80 verse range',
        'Save confidence',
        'Grid or list view'
      ],
      route: '/flow',
      color: '#10b981'
    },
    {
      title: 'Smart Flashcards',
      subtitle: 'Spaced Review',
      description: 'Study with smart repeats 🧠',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>`,
      benefits: [
        'Unlimited decks',
        'Share with friends',
        'Auto schedule'
      ],
      route: '/deck',
      color: '#f59e0b'
    },
    {
      title: 'Courses & Quizzes',
      subtitle: 'Step-by-step Learning',
      description: 'Create lessons and test 🎓',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3l9 5-9 5-9-5 9-5z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13v8m0-8l5-3m-5 3l-5-3" />
      </svg>`,
      benefits: [
        'Custom lessons',
        'Built-in quizzes'
      ],
      route: '/courses',
      color: '#ec4899'
    },
    {
      title: 'Daily Inspiration',
      subtitle: 'Verse of the Day',
      description: 'Fresh word each sunrise ☀️',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364l-2.121 2.121M8.757 15.243l-2.121 2.121m0-11.314l2.121 2.121M17.243 15.243l2.121 2.121M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>`,
      benefits: [
        'Daily verse',
        'Share easily'
      ],
      route: '/stats',
      color: '#f43f5e'
    },
    {
      title: 'Progress Analytics',
      subtitle: 'Stats & Streaks',
      description: 'Charts to keep you motivated 📊',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zM13 19v-9a2 2 0 00-2-2H9a2 2 0 00-2 2v9a2 2 0 002 2h2a2 2 0 002-2zM21 19v-3a2 2 0 00-2-2h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2z" />
      </svg>`,
      benefits: [
        'Daily tracking',
        'Export data',
        'Goal streaks'
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