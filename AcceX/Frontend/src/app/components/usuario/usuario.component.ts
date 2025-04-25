import { Component, OnInit, HostListener, inject } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { ProyectoService } from '../../services/proyectos.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.css']
})
export class UsuarioComponent implements OnInit {
  usuarios: any[] = [];
  usuarioForm: FormGroup;
  mostrarForm = false;
  editando = false;
  usuarioSeleccionado: any = null;
  posicionFormulario = { top: '0px', left: '0px' };
  bloquearCierre = false;
  busqueda: string = '';

  proyectosDelUsuario: any[] = [];
  proyectoIdParaAsociar: number | null = null;

  private usuarioService = inject(UsuarioService);
  private proyectoService = inject(ProyectoService);
  private fb = inject(FormBuilder);

  constructor(private router: Router) {
    this.usuarioForm = this.fb.group({
      gid_number: [''],
      nombre_usuario: [''],
      fecha_alta: [''],
      fecha_baja: [''],
      activo: [false],
      contacto: [''],
      telefono: [''],
      orcid: [''],
      scholar: [''],
      wos: [''],
      scopus: [''],
      res: [''],
      proyectoIdParaAsociar: [null]
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuarioService.obtenerUsuarios().subscribe(data => {
      this.usuarios = data;
    });
  }

  eliminarUsuario(id: number) {
    this.usuarioService.eliminarUsuario(id).subscribe(() => {
      this.cargarUsuarios();
      this.mostrarForm = false;
      this.usuarioSeleccionado = null;
      this.editando = false;
    });
  }

  mostrarFormulario(event: MouseEvent) {
    this.bloquearCierre = true;
    this.mostrarForm = true;
    this.editando = false;
    this.usuarioSeleccionado = null;
    this.usuarioForm.reset();

    const buttonElement = event.target as HTMLButtonElement;
    const rect = buttonElement.getBoundingClientRect();
    this.posicionFormulario.top = `${rect.bottom + window.scrollY}px`;
    this.posicionFormulario.left = `${rect.left}px`;

    setTimeout(() => this.bloquearCierre = false, 100);
  }

  editarUsuario(usuario: any, event: MouseEvent) {
    event.stopPropagation();
    this.bloquearCierre = true;
    this.mostrarForm = true;
    this.editando = true;
    this.usuarioSeleccionado = usuario;
  
    console.log("Usuario seleccionado:", this.usuarioSeleccionado); // 🐞 Debug
    this.cargarProyectosDeUsuario(usuario.uid_number);
  
    const fechaFormateada1 = usuario.fecha_alta
      ? new Date(usuario.fecha_alta).toISOString().split('T')[0]
      : '';
    const fechaFormateada2 = usuario.fecha_baja
      ? new Date(usuario.fecha_baja).toISOString().split('T')[0]
      : '';
  
    this.usuarioForm.patchValue({
      gid_number: usuario.gid_number,
      nombre_usuario: usuario.nombre_usuario,
      fecha_alta: fechaFormateada1 ?? '',
      fecha_baja: fechaFormateada2 ?? '',
      activo: usuario.activo === 1 || usuario.activo === true,
      contacto: usuario.contacto ?? '',
      telefono: usuario.telefono ?? '',
      orcid: usuario.orcid ?? '',
      scholar: usuario.scholar ?? '',
      wos: usuario.wos ?? '',
      scopus: usuario.scopus ?? '',
      res: usuario.res ?? '',
      proyectoIdParaAsociar: null
    });
  
    const buttonElement = event.target as HTMLButtonElement;
    const rect = buttonElement.getBoundingClientRect();
    this.posicionFormulario.top = `${rect.bottom + window.scrollY}px`;
    this.posicionFormulario.left = `${rect.left}px`;
  
    setTimeout(() => this.bloquearCierre = false, 100);
  }  

  guardarUsuario() {
    const usuarioData = this.usuarioForm.value;
  
    if (this.editando) {
      this.usuarioService.actualizarUsuario(this.usuarioSeleccionado.uid_number, usuarioData)
        .subscribe({
          next: () => {
            alert("✅ Usuario actualizado correctamente");
            this.mostrarForm = false;
            this.usuarioForm.reset();
            this.cargarUsuarios();
          },
          error: (err) => {
            console.error("❌ Error al actualizar:", err);
            if (err.error && err.error.error === 'El grupo especificado no existe') {
              alert("❌ Error: El grupo especificado no existe. Introduce un gid_number válido.");
            } else {
              alert("❌ Error al actualizar el usuario.");
            }
          }
        });
    } else {
      this.usuarioService.crearUsuario(usuarioData).subscribe({
        next: () => {
          alert("✅ Usuario creado correctamente");
          this.mostrarForm = false;
          this.usuarioForm.reset();
          this.cargarUsuarios();
        },
        error: (err) => {
          console.error("❌ Error al crear:", err);
          if (err.error && err.error.error === 'El grupo especificado no existe') {
            alert("❌ Error: El grupo especificado no existe. Introduce un gid_number válido.");
          } else {
            alert("❌ Error al crear el usuario.");
          }
        }
      });
    }
  }

  cargarProyectosDeUsuario(usuarioId: number) {
    this.proyectoService.obtenerProyectosPorUsuario(usuarioId).subscribe(proyectos => {
      this.proyectosDelUsuario = proyectos;
    });
  }

  asociarProyecto() {
    const proyectoId = this.usuarioForm.get('proyectoIdParaAsociar')?.value;
  
    if (!this.usuarioSeleccionado || !proyectoId) {
      alert("Debes seleccionar un usuario y proporcionar un ID de proyecto válido.");
      return;
    }
  
    this.proyectoService
      .asociarUsuarioAProyecto(proyectoId, this.usuarioSeleccionado.uid_number)
      .subscribe({
        next: () => {
          alert("Proyecto asociado correctamente.");
          this.cargarProyectosDeUsuario(this.usuarioSeleccionado.uid_number);
          this.usuarioForm.patchValue({ proyectoIdParaAsociar: null });
        },
        error: (err) => {
          console.error("Error al asociar proyecto:", err);
          alert("Error al asociar proyecto.");
        }
      });
  }
    
  eliminarProyectoDelUsuario(proyectoId: number) {
    if (!this.usuarioSeleccionado) {
      alert("No hay usuario seleccionado.");
      return;
    }
  
    this.proyectoService.eliminarUsuarioDeProyecto(proyectoId, this.usuarioSeleccionado.uid_number)
      .subscribe({
        next: () => {
          alert("Proyecto eliminado correctamente.");
          this.cargarProyectosDeUsuario(this.usuarioSeleccionado.uid_number);
        },
        error: (err) => {
          console.error("Error al eliminar el proyecto:", err);
          alert("Error al eliminar el proyecto.");
        }
      });
  }  

  verProyectos(usuario: any) {
    this.usuarioSeleccionado = usuario;
    this.cargarProyectosDeUsuario(usuario.uid_number);
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

  get usuariosFiltrados() {
    return this.usuarios.filter(usuario =>
      (usuario.nombre_usuario || '').toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }
}
