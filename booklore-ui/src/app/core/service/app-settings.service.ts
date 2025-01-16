import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';
import {AppSettings} from '../model/app-settings.model';

@Injectable({
  providedIn: 'root'
})
export class AppSettingsService {
  private apiUrl = 'http://localhost:8080/api/settings';

  private appSettingsSubject = new BehaviorSubject<AppSettings | null>(null);
  appSettings$ = this.appSettingsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadAppSettings();
  }

  loadAppSettings(): void {
    this.http.get<AppSettings>(this.apiUrl).subscribe({
      next: (settings: AppSettings) => {
        this.appSettingsSubject.next(settings);
      },
      error: (error) => {
        console.error('Error loading app settings:', error);
        this.appSettingsSubject.next(null);
      }
    });
  }

  saveAppSetting(category: string, key: string, newValue: string): void {
    const params = new HttpParams()
      .set('category', category)
      .set('key', key)
      .set('newValue', newValue);

    this.http.put(this.apiUrl, null, { params }).subscribe({
      next: () => {

      },
      error: (error) => {
        console.error('Error saving setting:', error);
      }
    });
  }
}
