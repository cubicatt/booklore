import { Injectable } from '@angular/core';
import {API_CONFIG} from '../../config/api-config';

@Injectable({
  providedIn: 'root'
})
export class UrlHelperService {
  private readonly baseUrl = API_CONFIG.BASE_URL;

  getCoverUrl(bookId: number, coverUpdatedOn?: string): string {
    return `${this.baseUrl}/api/v1/book/${bookId}/cover?${coverUpdatedOn || ''}`;
  }
}
