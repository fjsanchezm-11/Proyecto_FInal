import { Component, OnInit, HostListener, inject } from '@angular/core';
import { InvestigadoresService } from '../../services/investigadores.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-investigadores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './investigadores.component.html',
  styleUrls: ['./investigadores.component.css']
})
export class InvestigadoresComponent implements OnInit {
  investigadores: any[] = [];
  investigadorForm: FormGroup;
  mostrarForm = false;
  editando = false;
  investigadorSeleccionado: any = null;
  mostrandoDetalles = false;
  posicionFormulario = { top: '0px', left: '0px' }; 
  bloquearCierre = false; 
  busqueda: string = '';
  publicacionesDelInvestigador: any[] = [];
  publicacionIdParaAsociar: number | null = null;

  private investigadorService = inject(InvestigadoresService);
  private fb = inject(FormBuilder);

  constructor(public authService: AuthService) {
    this.investigadorForm = this.fb.group({
      nombre_investigador: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      crear_usuario: [true],
      gid_number: ['', Validators.required],
      nombre_usuario: ['', Validators.required],
      fecha_alta: [''],
      fecha_baja: [''],
      activo: [true],
      telefono: [''],
      orcid: [''],
      scholar: [''],
      wos: [''],
      scopus: [''],
      res: [''],
      publicacionIdParaAsociar: ['']
    });
    
  }

  ngOnInit(): void {
    this.cargarInvestigadores();
  }

  cargarInvestigadores() {
    this.investigadorService.obtenerInvestigadores().subscribe((investigadores) => {
      this.investigadores = investigadores;
    });
  }

  eliminarInvestigador(id: number) {
    this.investigadorService.eliminarInvestigador(id).subscribe(() => {
      this.cargarInvestigadores();
    });
  }

  mostrarFormulario(event: MouseEvent) {
    this.bloquearCierre = true; 
    this.mostrarForm = true;
    this.editando = false;
    this.investigadorSeleccionado = null;
    this.investigadorForm.reset();
    
    const buttonElement = event.target as HTMLButtonElement;
    const rect = buttonElement.getBoundingClientRect();
    this.posicionFormulario.top = `${rect.bottom + window.scrollY}px`;
    this.posicionFormulario.left = `${rect.left}px`;

    setTimeout(() => this.bloquearCierre = false, 100);
  }

  editarInvestigador(investigador: any, event: MouseEvent) {
    event.stopPropagation();
    this.investigadorSeleccionado = investigador;
    this.bloquearCierre = true;
    this.mostrarForm = true;
    this.editando = true;
    this.mostrandoDetalles = false;

    this.cargarPublicacionesDelInvestigador(investigador.iid_number);

    this.investigadorForm.patchValue({
      nombre_investigador: investigador.nombre_investigador,
      correo: investigador.correo
    });

    const buttonElement = event.target as HTMLButtonElement;
    const rect = buttonElement.getBoundingClientRect();
    this.posicionFormulario.top = `${rect.bottom + window.scrollY}px`;
    this.posicionFormulario.left = `${rect.left}px`;

    setTimeout(() => this.bloquearCierre = false, 100);
  }

  guardarInvestigador() {
    const formData = this.investigadorForm.value;
    formData.crear_usuario = true;
  
    if (this.editando) {
      this.investigadorService.actualizarInvestigador(this.investigadorSeleccionado.iid_number, formData).subscribe(() => {
        alert("Investigador actualizado correctamente");
        this.mostrarForm = false;
        this.cargarInvestigadores();
      });
    } else {
      this.investigadorService.crearInvestigador(formData).subscribe(() => {
        alert("Investigador y usuario creados correctamente");
        this.mostrarForm = false;
        this.cargarInvestigadores();
      }, (error) => {
        console.error("Error al crear el investigador y usuario", error);
        alert("Error al crear el investigador y usuario.");
      });
    }
  }
  

  cargarPublicacionesDelInvestigador(investigadorId: number) {
    this.investigadorService.getPublicacionesPorInvestigador(investigadorId).subscribe(publicaciones => {
      this.publicacionesDelInvestigador = publicaciones;
    });
  }

  asociarPublicacion() {
    const publicacionId = this.investigadorForm.get('publicacionIdParaAsociar')?.value;
    console.log("Investigador seleccionado:", this.investigadorSeleccionado);
    console.log("ID de publicación:", publicacionId); 
  
    if (!this.investigadorSeleccionado || !publicacionId) {
      alert("Debes seleccionar un investigador y proporcionar un ID de publicación válido.");
      return;
    }
  
    this.investigadorService.asociarPublicacionAInvestigador(this.investigadorSeleccionado.iid_number, publicacionId)
      .subscribe({
        next: () => {
          this.cargarPublicacionesDelInvestigador(this.investigadorSeleccionado.iid_number);
          this.investigadorForm.patchValue({ publicacionIdParaAsociar: null }); 
        },
        error: (err) => {
          console.error("Error al asociar publicación:", err);
          alert("Error al asociar la publicación.");
        }
      });
  }
  

  eliminarPublicacion(publicacionId: number) {
    if (!this.investigadorSeleccionado) {
      alert("No hay investigador seleccionado.");
      return;
    }
  
    this.investigadorService.eliminarPublicacionDeInvestigador(this.investigadorSeleccionado.iid_number, publicacionId)
      .subscribe({
        next: () => {
          this.cargarPublicacionesDelInvestigador(this.investigadorSeleccionado.iid_number);
        },
        error: (err) => {
          console.error("Error al eliminar la publicación:", err);
          alert("Error al eliminar la publicación.");
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

  get investigadoresFiltrados() {
    return this.investigadores.filter(inv =>
      inv.nombre_investigador?.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  /* Muestra los detalles del investigador */
mostrarDetalles(investigador: any) {
  this.investigadorSeleccionado = investigador;
  this.mostrandoDetalles = true;
  this.mostrarForm = false;

  this.cargarPublicacionesDelInvestigador(investigador.iid_number);
}

/* Cierra la ventana emergente */
cerrarDetalles() {
  this.investigadorSeleccionado = null;
  this.mostrandoDetalles = false;
}
/* Cierra el formulario de edición */
cerrarFormulario() {
  this.mostrarForm = false;
  this.editando = false;
  this.investigadorSeleccionado = null;
}
}
