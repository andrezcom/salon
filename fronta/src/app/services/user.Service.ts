import { environment } from "../../environments/environment";
import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { tap } from "rxjs";
import { User } from "../shared/models/user";

@Injectable({ providedIn: 'root' })

export class UserService {
  public users = signal<User[]>([]);
  private readonly _http = inject(HttpClient);
  private readonly _url = environment.url;

  constructor() {
    this.getUsers()
    console.log('models');

  }

  public getUsers(): void {
    this._http
      .get<User[]>(`${this._url}`)
      .pipe(tap((data: User[]) => this.users.set(data)))
      .subscribe();
  }

  public registerUser(user: any) {
    let newUser: User = {
      nameUser: user.nameUser,
      email: user.email,
      pass: user.pass,
      role: {
        seller: user.seller,
        admin: user.admin
      }
    };
    console.log('este es mi nuevo user', newUser);
    return this._http
      .post<User>(`${this._url}`, newUser)
      .subscribe({
        next: (_data) => {
          console.log(_data);
        },
        error: (err) => {
          console.log(err);
        }
      });
  }

}
