import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {
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

  obtenerUsuariosDeGrupo(grupoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${grupoId}/usuarios`);
  }

  asociarUsuarioAGrupo(grupoId: number, usuarioId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${grupoId}/usuarios`, { usuario_id: usuarioId });
  }

  eliminarUsuarioDeGrupo(grupoId: number, usuarioId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${grupoId}/usuarios/${usuarioId}`);
  }
}
