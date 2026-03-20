import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService); 
  const platformId = inject(PLATFORM_ID); // check môi trường để tránh lỗi SSR

  // 🛡️ BỎ QUA NẾU CHẠY TRÊN SERVER (Tránh crash SSR)
  if (!isPlatformBrowser(platformId)) {
    return true; 
  }

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