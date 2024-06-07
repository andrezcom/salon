
import { Injectable, inject, signal } from "@angular/core";
import { User } from "../shared/models/user";
import { UserService } from "../services/user.service";

@Injectable({ providedIn: 'root' })

export class ValidationErrors {
  userService = inject(UserService);
  users = this.userService.users;

  founded(email: String): any {
    const x = this.users().findIndex(call => call.email === email);
    console.log('encontrado: ', x);
    return x

  }
}