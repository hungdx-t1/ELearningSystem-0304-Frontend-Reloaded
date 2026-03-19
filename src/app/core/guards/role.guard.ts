import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // 1. Lấy danh sách các quyền ĐƯỢC PHÉP VÀO từ cấu hình route (app.routes.ts)
  const expectedRoles = route.data['roles'] as Array<string>;

  // Lấy Role của user hiện tại đang đăng nhập
  // (LƯU Ý: Chỗ này tùy thuộc vào cách bạn lưu Role lúc Login. Mình đang giả sử lưu ở localStorage)
  const currentRole = localStorage.getItem('role') || 'Student'; // tránh null

  // Kiểm tra xem Role hiện tại có nằm trong danh sách cho phép không?
  if (expectedRoles && expectedRoles.includes(currentRole)) {
    return true;
  } else {
    router.navigate(['/no-permission']);
    return false;
  }
};