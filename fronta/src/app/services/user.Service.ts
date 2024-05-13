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
  }

  public getUsers(): void {
    this._http
      .get<any[]>(`${this._url}`)
      .pipe(tap((data: any[]) => this.users.set(data)))
      .subscribe();
  }

}
