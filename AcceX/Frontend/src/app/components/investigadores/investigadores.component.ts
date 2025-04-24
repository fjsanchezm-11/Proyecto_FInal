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

  private investigadorService = inject(InvestigadoresService);
  private fb = inject(FormBuilder);

  constructor() {
    this.investigadorForm = this.fb.group({
      nombre_investigador: [''],
      correo: ['']
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
    if (this.editando) {
      this.investigadorService.actualizarInvestigador(this.investigadorSeleccionado.iid_number, this.investigadorForm.value).subscribe(() => {
        alert("Investigador actualizado correctamente");
        this.mostrarForm = false;
        this.cargarInvestigadores();
      });
    } else {
      this.investigadorService.crearInvestigador(this.investigadorForm.value).subscribe(() => {
        alert("Investigador creado correctamente");
        this.mostrarForm = false;
        this.cargarInvestigadores();
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

  get investigadoresFiltrados() {
    return this.investigadores.filter(inv =>
      inv.nombre_investigador?.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }
}
