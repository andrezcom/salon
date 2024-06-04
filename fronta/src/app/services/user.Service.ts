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
  /* private readonly _httpHeaders = inject(HttpHeaders); */
  private readonly _url = environment.url;
  private readonly nzMessageService = inject(NzMessageService);
  constructor() {
    this.getUsers()
    console.log('models');

  }

  public getUsers(): void {
    httpOpions:
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
    let newUser: newUser = {
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

  public putUser(user: any) {
    let newUser: User = {
      _id: user._id,
      nameUser: user.nameUser,
      email: user.email,
      pass: user.pass,
      role: {
        seller: user.seller,
        admin: user.admin
      }
    };
    console.log('entre a put');

    return this._http
      .put<User>(`${this._url}`, newUser)
      .subscribe({
        next: (_data) => {
          this.nzMessageService.create("success", `Usuario modificado con éxito`);
          console.log(_data);
        },
        error: (err) => {
          this.nzMessageService.create("error", `ERROR al modificar el usuario`);
          console.log(err);
        }
      });
  }

  public deleteUser(user: any) {
    let delUser: User = {
      _id: user._id,
      nameUser: user.nameUser,
      email: user.email,
      pass: user.pass,
      role: {
        seller: user.seller,
        admin: user.admin
      }
    };
    return this._http
      .post<User>(`${this._url}`, delUser)
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
