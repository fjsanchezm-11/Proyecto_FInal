import { Component, OnInit, HostListener, inject } from '@angular/core';
import { GrupoService } from '../../services/grupos.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './grupos.component.html',
  styleUrls: ['./grupos.component.css']
})
export class GruposComponent implements OnInit {
  grupos: { gid_number: number; nombre: string }[] = [];
  usuariosDelGrupo: { uid_number: number; nombre_usuario: string }[] = [];
  grupoForm: FormGroup;
  mostrarForm = false;
  editando = false;
  grupoSeleccionado: { gid_number: number; nombre: string } | null = null;
  mostrandoDetalles = false;
  posicionFormulario = { top: '0px', left: '0px' };
  bloquearCierre = false;
  busqueda = '';

  private grupoService = inject(GrupoService);
  private fb = inject(FormBuilder);

  constructor(public authService: AuthService) {
    this.grupoForm = this.fb.group({
      nombre: ['']
    });
  }

  ngOnInit(): void {
    this.cargarGrupos();
  }

  cargarGrupos(): void {
    this.grupoService.obtenerGrupos().subscribe({
      next: (grupos) => (this.grupos = grupos),
      error: (error) => console.error('Error cargando grupos', error)
    });
  }

  eliminarGrupo(id: number): void {
    this.grupoService.eliminarGrupo(id).subscribe({
      next: () => this.cargarGrupos(),
      error: (error) => console.error('Error eliminando grupo', error)
    });
  }

  mostrarFormulario(event: MouseEvent): void {
    this.prepararFormulario();
    this.posicionarFormulario(event);
  }

  editarGrupo(grupo: { gid_number: number; nombre: string }, event: MouseEvent): void {
    event.stopPropagation();
    this.prepararFormulario(grupo);
    this.posicionarFormulario(event);
    this.cargarUsuariosDelGrupo(grupo.gid_number);
  }

  eliminarUsuario(uid: number): void {
    if (!this.grupoSeleccionado) return;
    const gid = this.grupoSeleccionado.gid_number;
    this.grupoService.eliminarUsuarioDeGrupo(gid, uid).subscribe({
      next: () => {
        this.usuariosDelGrupo = this.usuariosDelGrupo.filter(u => u.uid_number !== uid);
      },
      error: (error) => console.error('Error eliminando usuario del grupo', error)
    });
  }

  guardarGrupo(): void {
    if (this.editando && this.grupoSeleccionado) {
      this.grupoService.actualizarGrupo(this.grupoSeleccionado.gid_number, this.grupoForm.value).subscribe({
        next: () => {
          this.mostrarForm = false;
          this.cargarGrupos();
        },
        error: (error) => console.error('Error actualizando grupo', error)
      });
    } else {
      this.grupoService.crearGrupo(this.grupoForm.value).subscribe({
        next: () => {
          this.mostrarForm = false;
          this.cargarGrupos();
        },
        error: (error) => console.error('Error creando grupo', error)
      });
    }
  }

  mostrarDetalles(grupo: { gid_number: number; nombre: string }): void {
    this.grupoSeleccionado = grupo;
    this.mostrandoDetalles = true;
    this.mostrarForm = false;
    this.cargarUsuariosDelGrupo(grupo.gid_number);
  }

  cerrarDetalles(): void {
    this.grupoSeleccionado = null;
    this.mostrandoDetalles = false;
  }

  cerrarFormulario(): void {
    this.mostrarForm = false;
    this.editando = false;
    this.grupoSeleccionado = null;
  }

  get gruposFiltrados() {
    return this.grupos.filter(g => g.gid_number.toString().includes(this.busqueda));
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

  private cargarUsuariosDelGrupo(gid: number): void {
    this.grupoService.obtenerUsuariosDeGrupo(gid).subscribe({
      next: (usuarios) => (this.usuariosDelGrupo = usuarios),
      error: (error) => console.error('Error cargando usuarios del grupo', error)
    });
  }

  private prepararFormulario(grupo?: { gid_number: number; nombre: string }): void {
    this.bloquearCierre = true;
    this.mostrarForm = true;
    this.editando = !!grupo;
    this.grupoSeleccionado = grupo || null;
    this.grupoForm.reset();
    if (grupo) {
      this.grupoForm.patchValue({ nombre: grupo.nombre });
    }
    setTimeout(() => (this.bloquearCierre = false), 100);
  }

  private posicionarFormulario(event: MouseEvent): void {
    const buttonElement = event.target as HTMLElement;
    const rect = buttonElement.getBoundingClientRect();
    this.posicionFormulario = {
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left}px`
    };
  }
}
