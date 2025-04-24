import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicacionesService {
  private apiUrl = 'http://127.0.0.1:5000/api/publicaciones';
  private http = inject(HttpClient);

  obtenerPublicaciones(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  obtenerPublicacionPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crearPublicacion(publicacion: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, publicacion);
  }

  actualizarPublicacion(id: number, publicacion: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, publicacion);
  }

  eliminarPublicacion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
