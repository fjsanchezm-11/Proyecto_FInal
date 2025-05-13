import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvestigadoresService {
  private apiUrl = 'http://127.0.0.1:5000/api/investigadores';
  private http = inject(HttpClient);

  obtenerInvestigadores(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearInvestigador(investigador: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, investigador);
  }

  actualizarInvestigador(id: number, investigador: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, investigador);
  }

  eliminarInvestigador(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getPublicacionesPorInvestigador(investigadorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${investigadorId}/publicaciones`);
  }
  
  asociarPublicacionAInvestigador(investigadorId: number, publicacionId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${investigadorId}/publicaciones`, { publicacion_id: publicacionId });
  }
  
  eliminarPublicacionDeInvestigador(investigadorId: number, publicacionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${investigadorId}/publicaciones/${publicacionId}`);
  }
}
