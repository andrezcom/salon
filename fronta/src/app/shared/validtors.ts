
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })

export class ValidateErrors {

  validatorEmail(email: String): boolean {
    let mailValido = false;
    let EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)$/;
    if (email.match(EMAIL_REGEX)) {
      mailValido = true;
    }
    console.log('funcion in: ', mailValido);
    return mailValido;
  }
}