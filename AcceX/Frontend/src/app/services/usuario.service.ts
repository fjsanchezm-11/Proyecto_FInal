import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = environment.apiUrl + '/usuarios';
  private http = inject(HttpClient);

  obtenerUsuarios(page = 1, perPage = 40): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearUsuario(usuario: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, usuario);
  }

  actualizarUsuario(id: number, usuario: any): Observable<any>{
    return this.http.put<any>(`${this.apiUrl}/${id}`, usuario);
  }

  eliminarUsuario(id: number): Observable<any>{
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  obtenerGruposDeUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${usuarioId}/grupos`);
  }

  asociarGrupoAUsuario(usuarioId: number, grupoId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${usuarioId}/grupos`, { grupo_id: grupoId });
  }

  eliminarGrupoDeUsuario(usuarioId: number, grupoId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${usuarioId}/grupos/${grupoId}`);
  }
}
