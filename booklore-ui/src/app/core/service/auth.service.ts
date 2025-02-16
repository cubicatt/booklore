import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { RxStompService } from '../../shared/websocket/rx-stomp.service';
import { createRxStompConfig } from '../../shared/websocket/rx-stomp.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:7050/api/v1/auth/login';
  private rxStompService?: RxStompService;

  constructor(private http: HttpClient, private injector: Injector) {}

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<{ token: string }>(this.apiUrl, credentials).pipe(
      tap((response) => {
        if (response.token) {
          this.saveToken(response.token);
          this.startWebSocket();
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

  private startWebSocket(): void {
    const token = this.getToken();
    if (token) {
      const rxStompService = this.getRxStompService();
      rxStompService.configure(createRxStompConfig(this));
      rxStompService.activate();
    }
  }

  private getRxStompService(): RxStompService {
    if (!this.rxStompService) {
      this.rxStompService = this.injector.get(RxStompService);
    }
    return this.rxStompService;
  }
}
