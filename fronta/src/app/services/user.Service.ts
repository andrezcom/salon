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

}
