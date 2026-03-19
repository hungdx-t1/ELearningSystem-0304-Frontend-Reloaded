import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService); 

  const expectedRoles = route.data['roles'] as Array<string>;
  
  // Hỏi AuthService xem Token này là của ai?
  const currentRole = authService.getUserRole();

  if (expectedRoles && expectedRoles.includes(currentRole)) {
    return true; 
  } else {
    router.navigate(['/no-permission']);
    return false;
  }
};