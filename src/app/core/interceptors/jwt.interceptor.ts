import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof window !== 'undefined') {
    // Lấy token từ bộ nhớ trình duyệt
    const token = localStorage.getItem('token');

    // Nếu có token, kẹp nó vào Header của request gửi đi
    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next(cloned);
    }
  }

  // Nếu không có, cứ gửi request đi bình thường (ví dụ: lúc mới đăng nhập)
  return next(req);
};
