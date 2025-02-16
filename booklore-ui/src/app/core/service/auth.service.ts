import { inject, Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { RxStompService } from '../../shared/websocket/rx-stomp.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:7050/api/v1/auth/login';
  private rxStompService?: RxStompService;

  private http = inject(HttpClient);
  private injector = inject(Injector);

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<{ token: string }>(this.apiUrl, credentials).pipe(
      tap((response) => {
        if (response.token) {
          this.saveToken(response.token);
          this.getRxStompService().activate();
        }
      })
    );
  }

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    this.getRxStompService().deactivate();
  }

  private getRxStompService(): RxStompService {
    if (!this.rxStompService) {
      this.rxStompService = this.injector.get(RxStompService);
    }
    return this.rxStompService;
  }
}
