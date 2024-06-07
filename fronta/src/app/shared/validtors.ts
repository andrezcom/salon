
import { Injectable, inject, signal } from "@angular/core";
import { User } from "../shared/models/user";
import { UserService } from "../services/user.service";

@Injectable({ providedIn: 'root' })

export class ValidateErrors {
  userService = inject(UserService);
  users = this.userService.users;

  founded(email: String): any {
    const x = this.users().findIndex(user => user.email === email);
    console.log('encontrado: ', x);
    return x
  }

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