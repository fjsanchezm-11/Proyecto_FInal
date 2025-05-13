import { Component, OnInit, HostListener, inject } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { ProyectoService } from '../../services/proyectos.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Validators } from '@angular/forms';

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
  mostrandoDetalles = false;
  posicionFormulario = { top: '0px', left: '0px' };
  bloquearCierre = false;
  busqueda: string = '';
  gruposDelUsuario: any[] = [];
  grupoIdParaAsociar: number | null = null;
  proyectosDelUsuario: any[] = [];
  proyectoIdParaAsociar: number | null = null;

  private usuarioService = inject(UsuarioService);
  private proyectoService = inject(ProyectoService);
  private fb = inject(FormBuilder);

  constructor(private router: Router,public authService: AuthService) {
    this.usuarioForm = this.fb.group({
      gid_number: ['', Validators.required],
      nombre_usuario: ['', Validators.required],
      fecha_alta: [''],
      fecha_baja: [''],
      activo: [false],
      contacto: ['', [Validators.required, Validators.email]],
      telefono: [''],
      orcid: [''],
      scholar: [''],
      wos: [''],
      scopus: [''],
      res: [''],
      proyectoIdParaAsociar: [null],
      nombre_investigador: [''],
      grupoIdParaAsociar: [null]
    });
    
  }

  mostrarDetalles(usuario: any) {
    this.usuarioSeleccionado = usuario;
    this.mostrandoDetalles = true;
    this.mostrarForm = false;

    this.cargarProyectosDeUsuario(usuario.uid_number);
    this.cargarGruposDeUsuario(usuario.uid_number);
  }

  cerrarDetalles() {
    this.usuarioSeleccionado = null;
    this.mostrandoDetalles = false;
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

  abrirFormularioUsuario(event: MouseEvent, usuario: any = null) {
    event.stopPropagation();
    this.bloquearCierre = true;
    this.mostrarForm = true;
    this.mostrandoDetalles = false;

    if (usuario) {
      this.editando = true;
      this.usuarioSeleccionado = usuario;
      this.cargarProyectosDeUsuario(usuario.uid_number);
      this.cargarGruposDeUsuario(usuario.uid_number);

      const fechaFormateada1 = usuario.fecha_alta
        ? new Date(usuario.fecha_alta).toISOString().split('T')[0]
        : '';
      const fechaFormateada2 = usuario.fecha_baja
        ? new Date(usuario.fecha_baja).toISOString().split('T')[0]
        : '';

      this.usuarioForm.patchValue({
        gid_number: usuario.gid_number,
        nombre_usuario: usuario.nombre_usuario,
        fecha_alta: fechaFormateada1,
        fecha_baja: fechaFormateada2,
        activo: usuario.activo === 1 || usuario.activo === true,
        contacto: usuario.contacto ?? '',
        telefono: usuario.telefono ?? '',
        orcid: usuario.orcid ?? '',
        scholar: usuario.scholar ?? '',
        wos: usuario.wos ?? '',
        scopus: usuario.scopus ?? '',
        res: usuario.res ?? '',
        proyectoIdParaAsociar: null,
        grupoIdParaAsociar: null,
        nombre_investigador: usuario.nombre_investigador ?? ''
      });
    } else {
      this.editando = false;
      this.usuarioSeleccionado = null;
      this.usuarioForm.reset();
      this.usuarioForm.get('activo')?.setValue(false);
    }

    const buttonElement = event.target as HTMLElement;
    const rect = buttonElement.getBoundingClientRect();
    this.posicionFormulario.top = `${rect.bottom + window.scrollY}px`;
    this.posicionFormulario.left = `${rect.left}px`;

    setTimeout(() => this.bloquearCierre = false, 100);
  }

  editarUsuario(usuario: any, event: MouseEvent) {
    this.abrirFormularioUsuario(event, usuario);
  }

  crearNuevoUsuario(event: MouseEvent) {
    this.abrirFormularioUsuario(event);
  }

  guardarUsuario() {
    const usuarioData = { ...this.usuarioForm.value };

    usuarioData.grupos = this.gruposDelUsuario.map(g => g.gid_number);
    usuarioData.proyectos = this.proyectosDelUsuario;

    if (this.editando) {
      this.usuarioService.actualizarUsuario(this.usuarioSeleccionado.uid_number, usuarioData)
        .subscribe({
          next: () => {
            alert("Usuario actualizado correctamente.");
            this.mostrarForm = false;
            this.usuarioForm.reset();
            this.cargarUsuarios();
          },
          error: (err) => {
            console.error("Error al actualizar:", err);
            alert("Error al actualizar el usuario.");
          }
        });
    } else {
      this.usuarioService.crearUsuario(usuarioData).subscribe({
        next: () => {
          alert("Usuario creado correctamente.");
          this.mostrarForm = false;
          this.usuarioForm.reset();
          if (usuarioData.grupoIdParaAsociar) {
            this.asociarGrupo();
          }
          this.cargarUsuarios();
        },
        error: (err) => {
          console.error("Error al crear:", err);
          const errorMsg = err.error?.error;
          if (errorMsg && errorMsg.includes("El grupo con gid_number")) {
            alert("Error: El grupo especificado no existe. Introduce un gid_number válido.");
          } else {
            console.error("Detalles del error:", errorMsg);
            alert("Error al crear el usuario.");
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

  cargarGruposDeUsuario(usuarioId: number) {
    this.usuarioService.obtenerGruposDeUsuario(usuarioId).subscribe(grupos => {
      this.gruposDelUsuario = grupos;
    });
  }

  asociarGrupo() {
  const grupoId = this.usuarioForm.get('grupoIdParaAsociar')?.value;
  if (!this.usuarioSeleccionado || !grupoId) {
    alert("Debes seleccionar un usuario y un grupo válido.");
    return;
  }

  this.usuarioService.asociarGrupoAUsuario(this.usuarioSeleccionado.uid_number, grupoId)
    .subscribe({
      next: () => {
        this.cargarGruposDeUsuario(this.usuarioSeleccionado.uid_number);
        this.usuarioForm.patchValue({ grupoIdParaAsociar: null });
      },
      error: (err) => {
        console.error("Error al asociar grupo:", err);
        alert("Error al asociar grupo.");
      }
    });
  }

  eliminarGrupoDelUsuario(grupoId: number) {
    if (!this.usuarioSeleccionado) {
      alert("No hay usuario seleccionado.");
      return;
    }

    this.usuarioService.eliminarGrupoDeUsuario(this.usuarioSeleccionado.uid_number, grupoId)
      .subscribe({
        next: () => {
          this.cargarGruposDeUsuario(this.usuarioSeleccionado.uid_number);
        },
        error: (err) => {
          console.error("Error al eliminar grupo:", err);
          alert("Error al eliminar grupo.");
        }
      });
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

  cerrarFormulario() {
    this.mostrarForm = false;
    this.editando = false;
    this.usuarioSeleccionado = null;
  }
}
