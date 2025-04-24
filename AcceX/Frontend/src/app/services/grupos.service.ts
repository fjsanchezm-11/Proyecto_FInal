import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GruposService {
  private apiUrl = 'http://127.0.0.1:5000/api/grupos';
  private http = inject(HttpClient);

  obtenerGrupos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  obtenerGrupoPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crearGrupo(grupo: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, grupo);
  }

  actualizarGrupo(id: number, grupo: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, grupo);
  }

  eliminarGrupo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  obtenerUsuariosPorGrupo(gid: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${gid}/usuarios`);
  }
  
  eliminarUsuarioDeGrupo(uid: number, gid: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${gid}/usuarios/${uid}`);
  }
}
