import { Component, inject } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastComponent {
  public notificationService = inject(NotificationService);
}