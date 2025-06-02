import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {
  private apiUrl = environment.apiUrl + '/grupos';
  private http = inject(HttpClient);

  obtenerGrupos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
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

  obtenerUsuariosDeGrupo(grupoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${grupoId}/usuarios`);
  }

  eliminarUsuarioDeGrupo(grupoId: number, usuarioId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${grupoId}/usuarios/${usuarioId}`);
  }
}
