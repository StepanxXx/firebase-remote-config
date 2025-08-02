import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  RemoteConfig, 
  Version, 
  ListVersionsResponse, 
  RollbackRemoteConfigRequest,
  HttpBody,
  FetchRemoteConfigRequest,
  FetchRemoteConfigResponse
} from '../models/remote-config.model';

@Injectable({
  providedIn: 'root',
})
export class RemoteConfigService {
  private readonly apiUrl = '/api';

  constructor(private http: HttpClient) {}

  // Основні методи для роботи з шаблоном
  getTemplate(versionNumber?: number): Observable<RemoteConfig> {
    let params = new HttpParams();
    if (versionNumber) {
      params = params.set('versionNumber', versionNumber.toString());
    }
    return this.http.get<RemoteConfig>(`${this.apiUrl}/template`, { params });
  }

  updateTemplate(data: RemoteConfig, validateOnly: boolean = false): Observable<RemoteConfig> {
    let params = new HttpParams();
    if (validateOnly) {
      params = params.set('validateOnly', 'true');
    }
    return this.http.put<RemoteConfig>(`${this.apiUrl}/template`, data, { params });
  }

  // Методи для роботи з версіями
  getVersions(pageSize?: number, pageToken?: string, endVersionNumber?: number, startTime?: string, endTime?: string): Observable<ListVersionsResponse> {
    let params = new HttpParams();
    if (pageSize) params = params.set('pageSize', pageSize.toString());
    if (pageToken) params = params.set('pageToken', pageToken);
    if (endVersionNumber) params = params.set('endVersionNumber', endVersionNumber.toString());
    if (startTime) params = params.set('startTime', startTime);
    if (endTime) params = params.set('endTime', endTime);
    
    return this.http.get<ListVersionsResponse>(`${this.apiUrl}/versions`, { params });
  }

  rollback(request: RollbackRemoteConfigRequest): Observable<RemoteConfig> {
    return this.http.post<RemoteConfig>(`${this.apiUrl}/rollback`, request);
  }

  // Методи для завантаження дефолтних значень
  downloadDefaults(format: 'XML' | 'PLIST' | 'JSON' = 'JSON'): Observable<HttpBody> {
    const params = new HttpParams().set('format', format);
    return this.http.get<HttpBody>(`${this.apiUrl}/downloadDefaults`, { params });
  }

  // Метод для отримання конфігурації клієнтом
  fetchConfig(request: FetchRemoteConfigRequest): Observable<FetchRemoteConfigResponse> {
    return this.http.post<FetchRemoteConfigResponse>(`${this.apiUrl}/fetch`, request);
  }

  // Додаткові методи для зручності роботи з UI
  validateTemplate(data: RemoteConfig): Observable<RemoteConfig> {
    return this.updateTemplate(data, true);
  }

  getAllVersions(): Observable<Version[]> {
    return this.getVersions().pipe(
      // Можна додати логіку для отримання всіх сторінок
    ) as Observable<Version[]>;
  }

  // Історія змін
  getHistory(params?: {
    pageSize?: number;
    pageToken?: string;
    endVersionNumber?: number;
    startTime?: string;
    endTime?: string;
  }): Observable<ListVersionsResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ListVersionsResponse>(`${this.apiUrl}/history`, { params: httpParams });
  }

  // Отримання конкретної версії
  getTemplateAtVersion(versionNumber: number): Observable<RemoteConfig> {
    return this.http.get<RemoteConfig>(`${this.apiUrl}/template/${versionNumber}`);
  }
}
