import { Component, OnInit, HostListener, inject } from '@angular/core';
import { GruposService } from '../../services/grupos.service';
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
  grupos: any[] = [];
  grupoForm: FormGroup;
  mostrarForm = false;
  editando = false;
  grupoSeleccionado: any = null;
  mostrandoDetalles = false;
  posicionFormulario = { top: '0px', left: '0px' };
  bloquearCierre = false;
  busqueda: string = '';
  usuariosDelGrupo: any[] = [];

  private grupoService = inject(GruposService);
  private fb = inject(FormBuilder);

  constructor(public authService: AuthService) {
    this.grupoForm = this.fb.group({
      nombre: ['']
    });
  }

  ngOnInit(): void {
    this.cargarGrupos();
  }

  cargarGrupos() {
    this.grupoService.obtenerGrupos().subscribe((grupos) => {
      this.grupos = grupos;
    });
  }

  eliminarGrupo(id: number) {
    this.grupoService.eliminarGrupo(id).subscribe(() => {
      this.cargarGrupos();
    });
  }

  mostrarFormulario(event: MouseEvent) {
    this.bloquearCierre = true;
    this.mostrarForm = true;
    this.editando = false;
    this.grupoSeleccionado = null;
    this.grupoForm.reset();

    const buttonElement = event.target as HTMLButtonElement;
    const rect = buttonElement.getBoundingClientRect();
    this.posicionFormulario.top = `${rect.bottom + window.scrollY}px`;
    this.posicionFormulario.left = `${rect.left}px`;

    setTimeout(() => this.bloquearCierre = false, 100);
  }

  editarGrupo(grupo: any, event: MouseEvent) {
    event.stopPropagation();
    this.bloquearCierre = true;
    this.mostrarForm = true;
    this.editando = true;
    this.grupoSeleccionado = grupo;
    this.mostrandoDetalles = false;
    this.grupoForm.patchValue({ nombre: grupo.nombre });
  
    const buttonElement = event.target as HTMLButtonElement;
    const rect = buttonElement.getBoundingClientRect();
    this.posicionFormulario.top = `${rect.bottom + window.scrollY}px`;
    this.posicionFormulario.left = `${rect.left}px`;
  
    this.grupoService.obtenerUsuariosPorGrupo(grupo.gid_number).subscribe(usuarios => {
      this.usuariosDelGrupo = usuarios;
    });
  
    setTimeout(() => this.bloquearCierre = false, 100);
  }
  
  eliminarUsuario(uid: number) {
    const gid = this.grupoSeleccionado?.gid_number;
    if (!gid) return;
  
    this.grupoService.eliminarUsuarioDeGrupo(uid, gid).subscribe(() => {
      this.usuariosDelGrupo = this.usuariosDelGrupo.filter(u => u.uid_number !== uid);
    });
  }
  
  guardarGrupo() {
    if (this.editando) {
      this.grupoService.actualizarGrupo(this.grupoSeleccionado.gid_number, this.grupoForm.value).subscribe(() => {
        alert("Grupo actualizado correctamente");
        this.mostrarForm = false;
        this.cargarGrupos();
      });
    } else {
      this.grupoService.crearGrupo(this.grupoForm.value).subscribe(() => {
        alert("Grupo creado correctamente");
        this.mostrarForm = false;
        this.cargarGrupos();
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

  get gruposFiltrados() {
    return this.grupos.filter(grupo =>
      grupo.gid_number.toString().includes(this.busqueda)
    );
  }

  mostrarDetalles(grupo: any) {
    this.grupoSeleccionado = grupo;
    this.mostrandoDetalles = true;
    this.mostrarForm = false; 
    this.grupoService.obtenerUsuariosPorGrupo(grupo.gid_number).subscribe(usuarios => {
      this.usuariosDelGrupo = usuarios;
    });
  }

  cerrarDetalles() {
    this.grupoSeleccionado = null;
    this.mostrandoDetalles = false;
  }

  cerrarFormulario() {
    this.mostrarForm = false;
    this.editando = false;
    this.grupoSeleccionado = null;
  }

}
