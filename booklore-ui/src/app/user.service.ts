import {inject, Injectable, Injector} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {API_CONFIG} from './config/api-config';
import {jwtDecode} from 'jwt-decode';
import {RxStompService} from './shared/websocket/rx-stomp.service';
import {Library} from './book/model/library.model';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  assignedLibraries: Library[];
  permissions: {
    admin: boolean;
    canUpload: boolean;
    canDownload: boolean;
    canEditMetadata: boolean;
    canManipulateLibrary: boolean;
  };
  bookPreferences: UserBookPreferences;
}

export interface UserBookPreferences {
  perBookSetting: {
    pdf: string;
    epub: string;
  };
  pdfReaderSetting: {
    pageSpread: string;
    pageZoom: string;
    showSidebar: boolean;
  };
  epubReaderSetting: {
    theme: string;
    font: string;
    fontSize: number;
  };
}

interface JwtPayload {
  sub: string;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${API_CONFIG.BASE_URL}/api/v1/auth/register`;
  private readonly userUrl = `${API_CONFIG.BASE_URL}/api/v1/users`;

  private http = inject(HttpClient);
  private injector = inject(Injector);

  private rxStompService?: RxStompService;

  private userDataSubject = new BehaviorSubject<User | null>(null);
  userData$ = this.userDataSubject.asObservable();

  constructor() {
    this.loadUserFromToken();
  }

  private loadUserFromToken(): void {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: JwtPayload = jwtDecode(token);
      this.fetchUser(decoded.userId);
    }
  }

  fetchUser(userId: number): void {
    this.http.get<User>(`${this.userUrl}/${userId}`).subscribe(user => {
      this.userDataSubject.next(user);
      this.startWebSocket();
    });
  }

  getLocalUser(): User | null {
    return this.userDataSubject.getValue();
  }

  createUser(userData: Omit<User, 'id'>): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.apiUrl, userData);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.userUrl);
  }

  updateUser(userId: number, updateData: Partial<User>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.userUrl}/${userId}`, updateData);
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.userUrl}/${userId}`);
  }

  updateBookPreferences(userId: number, prefs: UserBookPreferences): void {
    this.http.put<void>(`${this.userUrl}/${userId}/book-preferences`, prefs)
      .subscribe(() => {
        const currentUser = this.userDataSubject.getValue();
        if (currentUser) {
          const updatedUser = {...currentUser, bookPreferences: {...prefs}};
          this.userDataSubject.next(updatedUser);
        }
      });
  }

  private startWebSocket(): void {
    const token = this.getToken();
    if (token) {
      const rxStompService = this.getRxStompService();
      rxStompService.activate();
    }
  }

  private getRxStompService(): RxStompService {
    if (!this.rxStompService) {
      this.rxStompService = this.injector.get(RxStompService);
    }
    return this.rxStompService;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
