import type { HttpInterceptorFn } from '@angular/common/http';

export const exampleInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
