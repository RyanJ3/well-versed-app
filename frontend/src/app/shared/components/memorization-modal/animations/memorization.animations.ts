import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

export const memorizationAnimations = [
  trigger('fadeIn', [
    transition(':enter', [
      style({ opacity: 0, transform: 'scale(0.9)' }),
      animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
    ])
  ]),
  trigger('slideUp', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ])
  ]),
  trigger('celebration', [
    transition(':enter', [
      style({ opacity: 0, transform: 'scale(0)' }),
      animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        style({ opacity: 1, transform: 'scale(1)' }))
    ])
  ]),
  trigger('starFill', [
    transition(':enter', [
      style({ opacity: 0, transform: 'scale(0) rotate(180deg)' }),
      animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        style({ opacity: 1, transform: 'scale(1) rotate(0deg)' }))
    ])
  ]),
  trigger('flagRaise', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        style({ opacity: 1, transform: 'translateY(0)' }))
    ])
  ]),
  trigger('popupSlide', [
    state('show', style({
      opacity: 1,
      transform: 'translateY(0)'
    })),
    state('hide', style({
      opacity: 0,
      transform: 'translateY(10px)'
    })),
    transition('hide => show', animate('300ms ease-out')),
    transition('show => hide', animate('200ms ease-in'))
  ]),
  trigger('starMove', [
    transition(':enter', [
      animate('800ms cubic-bezier(0.4, 0, 0.2, 1)', keyframes([
        style({ 
          transform: 'translate(0, 0) scale(1)', 
          opacity: 1,
          offset: 0 
        }),
        style({ 
          transform: 'translate(var(--endX), var(--endY)) scale(0.8)', 
          opacity: 1,
          offset: 0.9 
        }),
        style({ 
          transform: 'translate(var(--endX), var(--endY)) scale(0)', 
          opacity: 0,
          offset: 1 
        })
      ]))
    ])
  ]),
  trigger('trophyBounce', [
    transition(':enter', [
      animate('1s', keyframes([
        style({ transform: 'scale(0) rotate(0deg)', offset: 0 }),
        style({ transform: 'scale(1.2) rotate(360deg)', offset: 0.5 }),
        style({ transform: 'scale(0.9) rotate(340deg)', offset: 0.7 }),
        style({ transform: 'scale(1) rotate(360deg)', offset: 1 })
      ]))
    ])
  ]),
  trigger('borderPulse', [
    transition(':enter', [
      style({ opacity: 0, transform: 'scale(0.95)' }),
      animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
    ])
  ]),
  trigger('verseTransition', [
    transition('* => *', [
      style({ opacity: 0, transform: 'translateX(-20px)' }),
      animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
    ])
  ]),
  trigger('fadeInOut', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(-10px)' }),
      animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ]),
    transition(':leave', [
      animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
    ])
  ]),
  trigger('optionHover', [
    transition(':enter', [
      style({ opacity: 0, transform: 'scale(0.95)' }),
      animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
    ])
  ]),
  trigger('progressPath', [
    transition(':enter', [
      style({ strokeDashoffset: 100 }),
      animate('1000ms ease-out', style({ strokeDashoffset: '*' }))
    ])
  ]),
  trigger('statReveal', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      animate('400ms {{ delay }}ms ease-out',
        style({ opacity: 1, transform: 'translateY(0)' })),
    ], { params: { delay: 0 } })
  ]),
  trigger('floatingNotification', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateX(-50%) translateY(-20px)' }),
      animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(-50%) translateY(0)' }))
    ]),
    transition(':leave', [
      animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(-50%) translateY(-20px)' }))
    ])
  ]),
  trigger('checkmark', [
    transition(':enter', [
      animate('400ms ease-out', keyframes([
        style({ transform: 'scale(0) rotate(-180deg)', opacity: 0, offset: 0 }),
        style({ transform: 'scale(1.2) rotate(25deg)', opacity: 1, offset: 0.5 }),
        style({ transform: 'scale(1) rotate(0)', opacity: 1, offset: 1 })
      ]))
    ])
  ])
];
