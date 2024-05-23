import type { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const exampleInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  return next(req).pipe(catchError(HttpInterceptorFn));
};
function HttpInterceptorFn(error: HttpErrorResponse): ReturnType<typeof throwError> {
  const errorResponse = ` Error code: ${error.status}, Error message: ${error.message}`;
  return throwError(() => errorResponse);
};
