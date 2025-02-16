import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {API_CONFIG} from './config/api-config';

interface UserCreateRequest {
  username: string;
  password: string;
  name: string;
  email: string;
  permissionUpload: boolean;
  permissionDownload: boolean;
  permissionEditMetadata: boolean;
}

interface UserUpdateRequest {
  name: string;
  email: string;
  permissions: {
    canUpload: boolean;
    canDownload: boolean;
    canEditMetadata: boolean;
  };
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  permissions: {
    canUpload: boolean;
    canDownload: boolean;
    canEditMetadata: boolean;
  };
  isEditing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${API_CONFIG.BASE_URL}/api/v1/auth/register`;
  private readonly userUrl = `${API_CONFIG.BASE_URL}/api/v1/users`;

  createUser(userData: UserCreateRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.apiUrl, userData);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.userUrl);
  }

  updateUser(userId: number, updateData: UserUpdateRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.userUrl}/${userId}`, updateData);
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.userUrl}/${userId}`);
  }

}
