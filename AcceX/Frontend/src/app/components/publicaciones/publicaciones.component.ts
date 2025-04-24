import { Component, OnInit, HostListener, inject } from '@angular/core';
import { PublicacionesService } from '../../services/publicaciones.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './publicaciones.component.html',
  styleUrls: ['./publicaciones.component.css']
})
export class PublicacionesComponent implements OnInit {
  publicaciones: any[] = [];
  publicacionForm: FormGroup;
  mostrarForm = false;
  editando = false;
  publicacionSeleccionada: any = null;
  posicionFormulario = { top: '0px', left: '0px' };
  bloquearCierre = false;
  busqueda: string = '';
  todosInvestigadores: any[] = [];
  investigadoresDePublicacion: any[] = [];
  nuevoInvestigadorId: number | null = null;

  private publicacionesService = inject(PublicacionesService);
  private fb = inject(FormBuilder);

  constructor() {
    this.publicacionForm = this.fb.group({
      result_description: [''],
      fecha_publicacion: [''],
      doi: ['']
    });
  }

  ngOnInit(): void {
    this.cargarPublicaciones();
  }
  
  cargarPublicaciones() {
    this.publicacionesService.obtenerPublicaciones().subscribe(publicaciones => {
      this.publicaciones = publicaciones;
    });
  }  
  
  eliminarPublicacion(id: number) {
    this.publicacionesService.eliminarPublicacion(id).subscribe(() => {
      this.cargarPublicaciones();
    });
  }

  mostrarFormulario(event: MouseEvent) {
    this.bloquearCierre = true;
    this.mostrarForm = true;
    this.editando = false;
    this.publicacionSeleccionada = null;
    this.publicacionForm.reset();
    
    const buttonElement = event.target as HTMLButtonElement;
    const rect = buttonElement.getBoundingClientRect();
    this.posicionFormulario.top = `${rect.bottom + window.scrollY}px`;
    this.posicionFormulario.left = `${rect.left}px`;

    setTimeout(() => this.bloquearCierre = false, 100);
  }

  editarPublicacion(publicacion: any, event: MouseEvent) {
    event.stopPropagation();
    this.bloquearCierre = true;
    this.mostrarForm = true;
    this.editando = true;
    this.publicacionSeleccionada = publicacion;

    const fechaFormateada = publicacion.fecha_publicacion
    ? new Date(publicacion.fecha_publicacion).toISOString().split('T')[0]
    : '';

    this.publicacionForm.patchValue({
      result_description: publicacion.result_description,
      fecha_publicacion: fechaFormateada,
      doi: publicacion.doi
    });

    const buttonElement = event.target as HTMLButtonElement;
    const rect = buttonElement.getBoundingClientRect();
    this.posicionFormulario.top = `${rect.bottom + window.scrollY}px`;
    this.posicionFormulario.left = `${rect.left}px`;

    setTimeout(() => this.bloquearCierre = false, 100);
  }

  guardarPublicacion() {
    if (this.editando) {
      this.publicacionesService.actualizarPublicacion(this.publicacionSeleccionada.result_code, this.publicacionForm.value).subscribe(() => {
        alert("Publicación actualizada correctamente");
        this.mostrarForm = false;
        this.publicacionForm.reset();
        this.cargarPublicaciones();
      });
    } else {
      this.publicacionesService.crearPublicacion(this.publicacionForm.value).subscribe(() => {
        alert("Publicación creada correctamente");
        this.mostrarForm = false;
        this.publicacionForm.reset();
        this.cargarPublicaciones();
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

  get publicacionesFiltradas() {
    return this.publicaciones.filter(pub =>
      pub.result_description?.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }  
  
}
