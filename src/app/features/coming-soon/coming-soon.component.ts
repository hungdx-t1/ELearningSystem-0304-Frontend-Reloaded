import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [],
  templateUrl: './coming-soon.component.html',
  styleUrl: './coming-soon.component.scss'
})
export class ComingSoonComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
