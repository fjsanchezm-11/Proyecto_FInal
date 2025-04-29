import { Component, OnInit, HostListener, inject } from '@angular/core';
import { ProyectoService } from '../../services/proyectos.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './proyectos.component.html',
  styleUrls: ['./proyectos.component.css']
})
export class ProyectosComponent implements OnInit {
  proyectos: any[] = [];
  proyectoForm: FormGroup;
  mostrarForm = false;
  editando = false;
  proyectoSeleccionado: any = null;
  mostrandoDetalles = false;
  posicionFormulario = { top: '0px', left: '0px' };
  bloquearCierre = false;
  busqueda: string = '';
  usuariosDelProyecto: any[] = [];
  usuarioIdParaAgregar: number | null = null;

  private proyectoService = inject(ProyectoService);
  private fb = inject(FormBuilder);

  constructor() {
    this.proyectoForm = this.fb.group({
      titulo: [''],
      fecha_inicio: [''],
      fecha_fin: [''],
      email: [''],
      gid_number: [''],
      institucion: [''],
      procedencia: [''],
      categoria: ['']
    });
  }

  ngOnInit(): void {
    this.cargarProyectos();
  }

  cargarProyectos() {
    this.proyectoService.obtenerProyectos().subscribe((proyectos) => {
      this.proyectos = proyectos;
    });
  }

  eliminarProyecto(id: number) {
    this.proyectoService.eliminarProyecto(id).subscribe(() => {
      this.cargarProyectos();
    });
  }

  mostrarFormulario(event: MouseEvent) {
    this.bloquearCierre = true;
    this.mostrarForm = true;
    this.editando = false;
    this.proyectoSeleccionado = null;
    this.proyectoForm.reset();

    const buttonElement = event.target as HTMLButtonElement;
    const rect = buttonElement.getBoundingClientRect();
    this.posicionFormulario.top = `${rect.bottom + window.scrollY}px`;
    this.posicionFormulario.left = `${rect.left}px`;

    setTimeout(() => this.bloquearCierre = false, 100);
  }

  editarProyecto(proyecto: any, event: MouseEvent) {
    event.stopPropagation();
    this.bloquearCierre = true;
    this.mostrarForm = true;
    this.editando = true;
    this.proyectoSeleccionado = proyecto;
    this.mostrandoDetalles = false;

    this.proyectoForm.patchValue({
      titulo: proyecto.titulo || '',
      fecha_inicio: proyecto.fecha_inicio || '',
      fecha_fin: proyecto.fecha_fin || '',
      email: proyecto.email || '',
      gid_number: proyecto.gid_number || '',
      institucion: proyecto.institucion || '',
      procedencia: proyecto.procedencia || '',
      categoria: proyecto.categoria || ''
    });

    this.proyectoService.obtenerUsuariosPorProyecto(proyecto.pid_number).subscribe(usuarios => {
      this.usuariosDelProyecto = usuarios;
    });

    setTimeout(() => this.bloquearCierre = false, 100);
  }

  eliminarUsuario(uid: number) {
    const pid = this.proyectoSeleccionado?.pid_number;
    if (!pid) return;

    this.proyectoService.eliminarUsuarioDeProyecto(pid, uid).subscribe(() => {
      this.usuariosDelProyecto = this.usuariosDelProyecto.filter(u => u.uid_number !== uid);
    });
  }

  guardarProyecto() {
    if (this.editando) {
      this.proyectoService.actualizarProyecto(this.proyectoSeleccionado.pid_number, this.proyectoForm.value).subscribe(() => {
        alert("Proyecto actualizado correctamente");
        this.mostrarForm = false;
        this.cargarProyectos();
      });
    } else {
      this.proyectoService.crearProyecto(this.proyectoForm.value).subscribe(() => {
        alert("Proyecto creado correctamente");
        this.mostrarForm = false;
        this.cargarProyectos();
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.bloquearCierre) return;
    const formElement = document.querySelector('.popup-form');
    if (this.mostrarForm && formElement && !formElement.contains(event.target as Node)) {
      this.mostrarForm = false;
    }
  }

  onFormClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  get proyectosFiltrados() {
    return this.proyectos.filter(proyecto =>
      proyecto.titulo.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  verificarProyectoExiste(pid: number): Observable<boolean> {
    return this.proyectoService.obtenerProyectoPorId(pid).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  asociarUsuarioAProyecto(pid: number) {
    if (this.usuarioIdParaAgregar === null) {
      alert("Debes ingresar un ID válido de usuario.");
      return;
    }
  
    this.verificarProyectoExiste(pid).subscribe(existe => {
      if (existe) {
        this.proyectoService.asociarUsuarioAProyecto(pid, this.usuarioIdParaAgregar!).subscribe(() => {
          this.proyectoService.obtenerUsuariosPorProyecto(pid).subscribe(usuarios => {
            this.usuariosDelProyecto = usuarios;
            this.usuarioIdParaAgregar = null; 
          });
        });
      } else {
        alert("El proyecto no existe.");
      }
    });
  }

  mostrarDetalles(proyecto: any) {
    this.proyectoSeleccionado = proyecto;
    this.mostrandoDetalles = true;
    this.mostrarForm = false; // Cerramos el formulario de edición si estaba abierto
  }

  cerrarDetalles() {
    this.proyectoSeleccionado = null;
    this.mostrandoDetalles = false;
  }

  cerrarFormulario() {
    this.mostrarForm = false;
    this.editando = false;
    this.proyectoSeleccionado = null;
  }
  
}
