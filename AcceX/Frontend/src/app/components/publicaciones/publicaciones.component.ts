import { Component, OnInit, HostListener, inject, } from '@angular/core';
import { PublicacionesService } from '../../services/publicaciones.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './publicaciones.component.html',
  styleUrls: ['./publicaciones.component.css'],
})
export class PublicacionesComponent implements OnInit {
  publicaciones: any[] = [];
  publicacionForm: FormGroup;
  mostrarForm = false;
  editando = false;
  publicacionSeleccionada: any = null;
  mostrandoDetalles = false;
  posicionFormulario = { top: '0px', left: '0px' };
  bloquearCierre = false;
  busqueda: string = '';
  todosInvestigadores: any[] = [];
  investigadoresDePublicacion: any[] = [];
  nuevoInvestigadorId: number | null = null;

  private publicacionesService = inject(PublicacionesService);
  private fb = inject(FormBuilder);

  constructor(public authService: AuthService) {
    this.publicacionForm = this.fb.group({
      result_description: [''],
      fecha_publicacion: [''],
      doi: [''],
      nuevoInvestigadorId: [null]
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
    this.mostrandoDetalles = false;
  
    this.cargarInvestigadoresDePublicacion(publicacion.result_code);
  
    let fechaFormateada = '';
    if (publicacion.fecha_publicacion) { 
      try {
        const fecha = new Date(publicacion.fecha_publicacion);
        if (!isNaN(fecha.getTime())) { 
          fechaFormateada = fecha.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error('Error al convertir la fecha:', publicacion.fecha_publicacion);
      }
    }
  
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

  cargarInvestigadoresDePublicacion(publicacionId: number) {
    this.publicacionesService.getInvestigadoresPorPublicacion(publicacionId).subscribe(investigadores => {
      this.investigadoresDePublicacion = investigadores;
    });
  }

  asociarInvestigador() {
    const investigadorId = this.publicacionForm.get('nuevoInvestigadorId')?.value; // Obtén el ID del investigador del formulario
  
    if (!this.publicacionSeleccionada || !investigadorId) {
      alert("Debes seleccionar una publicación y proporcionar un ID de investigador válido.");
      return;
    }
  
    this.publicacionesService.asociarInvestigadorAPublicacion(this.publicacionSeleccionada.result_code, investigadorId)
      .subscribe({
        next: () => {
          this.cargarInvestigadoresDePublicacion(this.publicacionSeleccionada.result_code);
          this.publicacionForm.patchValue({ nuevoInvestigadorId: null }); 
        },
        error: (err) => {
          console.error("Error al asociar investigador:", err);
          alert("Error al asociar el investigador.");
        }
      });
  }

  eliminarInvestigador(investigadorId: number) {
    if (!this.publicacionSeleccionada) {
      alert("No hay publicación seleccionada.");
      return;
    }
  
    this.publicacionesService.eliminarInvestigadorDePublicacion(this.publicacionSeleccionada.result_code, investigadorId)
      .subscribe({
        next: () => {
          this.cargarInvestigadoresDePublicacion(this.publicacionSeleccionada.result_code);
        },
        error: (err) => {
          console.error("Error al eliminar investigador:", err);
          alert("Error al eliminar el investigador.");
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

  get publicacionesFiltradas() {
    return this.publicaciones.filter(pub =>
      pub.result_description?.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }  
  
  mostrarDetalles(publicacion: any) {
    this.publicacionSeleccionada = publicacion;
    this.mostrandoDetalles = true;
    this.mostrarForm = false;
  }

  cerrarDetalles() {
    this.publicacionSeleccionada = null;
    this.mostrandoDetalles = false;
  }

  cerrarFormulario() {
    this.mostrarForm = false;
    this.editando = false;
    this.publicacionSeleccionada = null;
  }

}
