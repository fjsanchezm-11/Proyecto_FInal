import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {
  private apiUrl = environment.apiUrl + '/proyectos';
  private usuariosApiUrl = environment.apiUrl + '/usuarios';
  private http = inject(HttpClient);

  obtenerProyectos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  obtenerProyectoPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crearProyecto(proyecto: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, proyecto);
  }

  actualizarProyecto(id: number, proyecto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, proyecto);
  }

  eliminarProyecto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  obtenerUsuariosPorProyecto(proyectoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${proyectoId}/usuarios`);
  }

  asociarUsuarioAProyecto(proyectoId: number, usuarioId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${proyectoId}/usuarios`, { usuario_id: usuarioId });
  }

  eliminarUsuarioDeProyecto(proyectoId: number, usuarioId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${proyectoId}/usuarios/${usuarioId}`);
  }

  obtenerProyectosPorUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.usuariosApiUrl}/${usuarioId}/proyectos`);
  }
}
