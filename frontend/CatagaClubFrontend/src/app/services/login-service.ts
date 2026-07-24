import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { AuthUser, LoginResponse } from './models';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly apiUrl = environment.apiBaseUrl;
  private http = inject(HttpClient);

  public user: AuthUser | null = null;
  public isLogged = signal<boolean>(false);

  public login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login/`, {
      username,
      password,
    });
  }

  public logout(): void {
    this.user = null;
    this.isLogged.set(false);
  }
}
