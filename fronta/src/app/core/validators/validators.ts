import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function sanitizer(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const invalid = /[<>/"'`;{}]/g.test(control.value);
    return invalid ? { 'invalid': { value: control.value } } : null;  // Invertir aquí
  };
}


export function validpass(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const invalid = /^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{5,8}$/.test(control.value);
    return invalid ? { 'password': { value: control.value } } : null;  // Invertir aquí
  };
}