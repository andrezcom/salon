import { environment } from "../../environments/environment";
import { Injectable, inject, signal } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from "rxjs";
import { User } from "../shared/models/user";
import { newUser } from "../shared/models/user";

import { NzMessageService } from 'ng-zorro-antd/message'

@Injectable({ providedIn: 'root' })

export class UserService {
  public users = signal<User[]>([]);

  private readonly _http = inject(HttpClient);
  private readonly _url = environment.url;
  private readonly nzMessageService = inject(NzMessageService);

  constructor() {
    this.getUsers()
  }

  public getUsers(): void {
    this.users.bind
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

    return this._http
      .post<any>(`${this._url}/login`, loginUser)
      .subscribe({
        next: (_data) => {
          this.nzMessageService.create("success", `Usuario autorizado con éxito`);
          localStorage.setItem('token', _data.token)
        },
        error: (err) => {
          this.nzMessageService.create("error", `ERROR con el usuario`);
        }
      });
  }

  public registerUser(user: any) {
    let newUser: newUser = {
      nameUser: user.nameUser,
      email: user.email,
      pass: user.pass,
      role: {
        seller: user.seller,
        admin: user.admin
      },
      active: true
    };

    return this._http
      .post<newUser>(`${this._url}`, newUser)
      .subscribe({
        next: (_data) => {
          this.nzMessageService.create("success", `Usuario creado con éxito`);
          this.getUsers()
        },
        error: (err) => {
          this.nzMessageService.create("error", `ERROR al crear usuario`);
        }
      });
  }

  public putUser(user: any) {
    let newUser: User = {
      _id: user._id,
      nameUser: user.nameUser,
      email: user.email,
      pass: user.pass,
      role: {
        seller: user.role.seller,
        admin: user.role.admin
      },
      active: user.active
    };

    let mailValido = false;
    let EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)$/;
    if (!newUser.email.match(EMAIL_REGEX)) {
      this.getUsers()
      return this.nzMessageService.create("error", 'Email invalido')
    }

    if (newUser.email === '') {
      this.getUsers()
      return this.nzMessageService.create("error", 'Email Vacio')
    }

    return this._http
      .put<User>(`${this._url}`, newUser)
      .subscribe({
        next: (_data) => {
          this.nzMessageService.create("success", `Usuario modificado con éxito`);
        },
        error: (err) => {
          this.getUsers()
          if (err.error.err.codeName === 'DuplicateKey') {
            this.nzMessageService.create("error", 'Email Duplicado')
          }
          else this.nzMessageService.create("error", 'ERROR al modificar usuario')
        }
      });
  }

  public deleteUser(_id: any) {
    return this._http
      .delete<User>(`${this._url}/${_id}`)
      .subscribe({
        next: (_data) => {
          this.nzMessageService.create("success", `Usuario borrado con éxito`);
        },
        error: (err) => {
          this.nzMessageService.create("error", `ERROR al borrar usuario`);
        }
      });
  }
}
