import { environment } from "../../environments/environment";
import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { tap } from "rxjs";
import { User } from "../shared/models/user";

import { NzMessageService } from 'ng-zorro-antd/message'

@Injectable({ providedIn: 'root' })

export class UserService {
  public users = signal<User[]>([]);
  private readonly _http = inject(HttpClient);
  private readonly _url = environment.url;
  private readonly nzMessageService = inject(NzMessageService);
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

  public loginUser(user: any) {
    let loginUser = {
      email: user.nameUser,
      pass: user.pass
    };
    console.log(
      'mi loginUser es: ', loginUser
    );

    return this._http
      .post<any>(`${this._url}/login`, loginUser)
      .subscribe({
        next: (_data) => {
          this.nzMessageService.create("success", `Usuario autorizado con éxito`);
          localStorage.setItem('token', _data.token)
          console.log('mi token: ', localStorage.getItem('token'));
        },
        error: (err) => {
          this.nzMessageService.create("error", `ERROR con el usuario`);
          console.log(err);
        }
      });
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
    return this._http
      .post<User>(`${this._url}`, newUser)
      .subscribe({
        next: (_data) => {
          this.nzMessageService.create("success", `Usuario creado con éxito`);
          console.log(_data);
        },
        error: (err) => {
          this.nzMessageService.create("error", `ERROR al crear usuario`);
          console.log(err);
        }
      });
  }
}
