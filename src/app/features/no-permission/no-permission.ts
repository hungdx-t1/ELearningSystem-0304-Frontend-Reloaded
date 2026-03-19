import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-permission',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './no-permission.html'
})
export class NoPermissionComponent {}