import { Component, OnInit, HostListener, inject } from '@angular/core';
import { InvestigadoresService } from '../../services/investigadores.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';

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
  posicionFormulario = { top: '0px', left: '0px' }; 
  bloquearCierre = false; 
  busqueda: string = '';
  publicacionesDelInvestigador: any[] = [];
  publicacionIdParaAsociar: number | null = null;

  private investigadorService = inject(InvestigadoresService);
  private fb = inject(FormBuilder);

  constructor() {
    this.investigadorForm = this.fb.group({
      nombre_investigador: [''],
      correo: [''],
      crear_usuario: [false],
      nombre_usuario: [''],
      gid_number: [null],
      fecha_alta: [''],
      contacto: [''],
      telefono: [''],
      orcid: [''],
      scholar: [''],
      wos: [''],
      scopus: [''],
      res: [''],
      publicacionIdParaAsociar: [null]
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
    this.bloquearCierre = true;
    this.mostrarForm = true;
    this.editando = true;
    this.investigadorSeleccionado = investigador;

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
    const formValue = this.investigadorForm.value;
  
    const datos = {
      nombre_investigador: formValue.nombre_investigador,
      correo: formValue.correo,
      crear_usuario: true,
      nombre_usuario: formValue.nombre_usuario,
      gid_number: formValue.gid_number,
      contacto: formValue.contacto,
      telefono: formValue.telefono,
      orcid: formValue.orcid,
      scholar: formValue.scholar,
      wos: formValue.wos,
      scopus: formValue.scopus,
      res: formValue.res
    };
  
    console.log("Datos que se envían al backend:", datos);
  
    if (this.editando) {
      this.investigadorService.actualizarInvestigador(this.investigadorSeleccionado.iid_number, datos).subscribe({
        next: () => {
          alert("✅ Investigador actualizado correctamente");
          this.mostrarForm = false;
          this.cargarInvestigadores();
        },
        error: (err) => {
          console.error("❌ Error al actualizar:", err);
        }
      });
    } else {
      this.investigadorService.crearInvestigador(datos).subscribe({
        next: () => {
          alert("✅ Investigador y usuario creados correctamente");
          this.mostrarForm = false;
          this.investigadorForm.reset();
          this.cargarInvestigadores();
        },
        error: (err) => {
          console.error("❌ Error al crear:", err);
        }
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
}
