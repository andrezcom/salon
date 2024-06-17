import type { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const exampleInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  console.log('mi req', req);
  const token: string = localStorage.getItem('token') || 'string';

  let request = req;

  if (token) {
    request = req.clone({
      setHeaders: {
        authorization: `${token}`
      }
    });
  }
  console.log('este es req', request);


  return next(request).pipe(catchError(HttpInterceptorFn));
};
function HttpInterceptorFn(error: HttpErrorResponse): ReturnType<typeof throwError> {
  const errorResponse = ` Error code: ${error.status}, Error message: ${error.message}`;
  return throwError(() => errorResponse);
};





/* import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor {

  constructor() { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const token: string = localStorage.getItem('token') || 'string';

    let request = req;

    if (token) {
      request = req.clone({
        setHeaders: {
          authorization: `token establecido ${token}`
        }
      });
    }
    console.log('este es req', request);

    return next.handle(request);
  }

} */