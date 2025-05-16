import { Component, OnInit } from '@angular/core';
import { GrupoService } from '../../services/grupos.service';
import { UsuarioService } from '../../services/usuario.service';
import { ProyectoService } from '../../services/proyectos.service';
import { PublicacionesService } from '../../services/publicaciones.service';
import { InvestigadoresService } from '../../services/investigadores.service';
import { Chart } from 'chart.js/auto';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estadisticas',
  imports: [CommonModule],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css'
})
export class EstadisticasComponent implements OnInit {
  datosProyectos: any[] = [];
  datosUsuarios: any[] = [];
  datosPublicaciones: any[] = [];
  vistaActual: string = 'usuariosPorGrupo';
  chartInstance: Chart | null = null; 

  constructor(
    private proyectoService: ProyectoService,
    private investigadoresService: InvestigadoresService,
    private publicacionesService: PublicacionesService,
    private usuarioService: UsuarioService,
    private grupoService: GrupoService
  ) {}

  ngOnInit(): void {
    this.proyectoService.obtenerProyectos().subscribe((proyectos) => {
      this.datosProyectos = proyectos;
    });

    this.usuarioService.obtenerUsuarios().subscribe((usuarios) => {
      this.datosUsuarios = usuarios;
    });

    this.mostrarVista('usuariosPorGrupo');
  }

  mostrarVista(vista: string) {
    this.vistaActual = vista;
    
    setTimeout(() => {
      if (vista === 'proyectosPorCategoria') {
        this.generarGraficoProyectosPorCategoria();
      } else if (vista === 'usuariosPorGrupo') {
        this.generarGraficoUsuariosPorGrupo();
      } else if (vista === 'usuariosPorProyecto') {
        this.generarGraficoUsuariosPorProyecto();
      } else if (vista === 'proyectosPorAño') {
        this.generarGraficoProyectosPorAño();
      } else if (vista === 'publicacionesPorInvestigador') {
        this.generarGraficoPublicacionesPorInvestigador();
      } else if (vista === 'publicacionesPorAño') {
        this.generarGraficoPublicacionesPorAño();
      }
    }, 100);
  }

  generarGraficoProyectosPorCategoria() {
    const categorias = this.datosProyectos.map(proyecto => proyecto.categoria);
    const conteoCategorias = categorias.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const ctx = document.getElementById("proyectosPorCategoria") as HTMLCanvasElement;
    
    if (ctx) {
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      this.chartInstance = new Chart(ctx, {
        type: "pie",
        data: {
          labels: Object.keys(conteoCategorias),
          datasets: [{
            data: Object.values(conteoCategorias),
            backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545"]
          }]
        }
      });
    } else {
      console.error("❌ Error: No se encontró el canvas 'proyectosPorCategoria'");
    }
  }

  generarGraficoUsuariosPorGrupo() {
    this.grupoService.obtenerGrupos().subscribe((grupos) => {
      if (!grupos || grupos.length === 0) {
        console.warn("⚠️ No hay grupos disponibles.");
        return;
      }

      const conteoGrupos: { [key: string]: number } = {};
      let llamadasPendientes = grupos.length; 

      grupos.forEach(grupo => {
        if (!grupo.gid_number) {
          console.warn("⚠️ Grupo sin gid_number:", grupo);
          return; 
        }

        this.grupoService.obtenerUsuariosDeGrupo(grupo.gid_number).subscribe((usuarios) => {
          conteoGrupos[grupo.gid_number] = usuarios.length;
          llamadasPendientes--;

          if (llamadasPendientes === 0) {
            this.crearGraficoBarras(conteoGrupos); 
          }
        });
      });
    });
  }

  crearGraficoBarras(conteoGrupos: { [key: string]: number }) {
    const ctx = document.getElementById("usuariosPorGrupo") as HTMLCanvasElement;

    if (ctx) {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
        ctx.innerHTML = "";
      }

      this.chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: Object.keys(conteoGrupos),
          datasets: [{
            label: "Usuarios por grupo",
            data: Object.values(conteoGrupos),
            backgroundColor: "#007bff"
          }]
        },
        options: {
          indexAxis: 'y',
          scales: {
            x: { beginAtZero: true, title: { display: true, text: "Cantidad de usuarios" } },
            y: { title: { display: true, text: "Grupos" } }
          }
        }
      });
    } else {
      console.error("❌ Error: No se encontró el canvas 'usuariosPorGrupo'");
    }
  }

  generarGraficoUsuariosPorProyecto() {
    this.proyectoService.obtenerProyectos().subscribe((proyectos) => {
      if (!proyectos || proyectos.length === 0) return;

      const conteoUsuariosPorProyecto: { [key: string]: number } = {};
      let llamadasPendientes = proyectos.length;

      proyectos.forEach(proyecto => {
        if (!proyecto.pid_number) return;

        this.proyectoService.obtenerUsuariosPorProyecto(proyecto.pid_number).subscribe((usuarios) => {
          conteoUsuariosPorProyecto[proyecto.pid_number] = usuarios.length;

          llamadasPendientes--;
          if (llamadasPendientes === 0) {
            this.crearGraficoBarrasProyecto(conteoUsuariosPorProyecto);
          }
        });
      });
    });
  }

  crearGraficoBarrasProyecto(conteoUsuariosPorProyecto: { [key: string]: number }) {
    const ctx = document.getElementById("usuariosPorProyecto") as HTMLCanvasElement;

    if (!ctx) return;

    if (this.chartInstance) this.chartInstance.destroy();

    this.chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(conteoUsuariosPorProyecto),
        datasets: [{
          label: "Usuarios por proyecto",
          data: Object.values(conteoUsuariosPorProyecto),
          backgroundColor: Object.keys(conteoUsuariosPorProyecto).map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`),
          borderColor: "#000",
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Cantidad de usuarios" } },
          x: { title: { display: true, text: "Proyectos" }, ticks: {maxTicksLimit: 20 } }
        }
      }
    });
  }

  generarGraficoProyectosPorAño() {
    const proyectosValidos = this.datosProyectos.filter(proyecto => proyecto.fecha_fin || proyecto.fecha_inicio);

    const conteoProyectosPorAño = proyectosValidos.reduce((acc, proyecto) => {
      const fecha = proyecto.fecha_fin || proyecto.fecha_inicio;
      const año = new Date(fecha).getFullYear();

      acc[año] = (acc[año] || 0) + 1;
      return acc;
    }, {});

    const ctx = document.getElementById("proyectosPorAño") as HTMLCanvasElement;

    if (!ctx) {
      console.error("❌ Error: No se encontró el canvas 'proyectosPorAño'");
      return;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(conteoProyectosPorAño).sort(), 
        datasets: [{
          label: "Cantidad de proyectos por año",
          data: Object.values(conteoProyectosPorAño),
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.2)",
          borderWidth: 2,
          pointBackgroundColor: "#007bff",
          pointBorderColor: "#000"
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: "top" }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Cantidad de proyectos" } },
          x: { title: { display: true, text: "Año" } }
        }
      }
    });
  }

  generarGraficoPublicacionesPorInvestigador() {
    this.investigadoresService.obtenerInvestigadores().subscribe((investigadores) => {
      if (!investigadores || investigadores.length === 0) {
        console.warn("⚠️ No hay investigadores disponibles.");
        return;
      }

      const conteoPublicacionesPorInvestigador: { [key: string]: number } = {};
      let llamadasPendientes = investigadores.length;

      investigadores.forEach(investigador => {
        if (!investigador.iid_number) {
          console.warn("⚠️ Investigador sin ID:", investigador);
          return;
        }

        this.investigadoresService.getPublicacionesPorInvestigador(investigador.iid_number).subscribe((publicaciones) => {
          if (publicaciones.length > 0) {
            conteoPublicacionesPorInvestigador[investigador.nombre_investigador] = publicaciones.length;
          }

          llamadasPendientes--;
          if (llamadasPendientes === 0) {
            this.crearGraficoPie(conteoPublicacionesPorInvestigador);
          }
        });
      });
    });
  }

  crearGraficoPie(conteoPublicacionesPorInvestigador: { [key: string]: number }) {
    const ctx = document.getElementById("publicacionesPorInvestigador") as HTMLCanvasElement;

    if (!ctx) {
      console.error("❌ Error: No se encontró el canvas 'publicacionesPorInvestigador'");
      return;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(conteoPublicacionesPorInvestigador),
        datasets: [{
          data: Object.values(conteoPublicacionesPorInvestigador),
          backgroundColor: Object.keys(conteoPublicacionesPorInvestigador).map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`),
          borderColor: "#000",
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          legend: { position: "right" }
        }
      }
    });
  }

  generarGraficoPublicacionesPorAño() {
    this.publicacionesService.obtenerPublicaciones().subscribe((publicaciones) => {
      if (!publicaciones || publicaciones.length === 0) {
        console.warn("⚠️ No hay publicaciones disponibles.");
        return;
      }

      const publicacionesValidas = publicaciones.filter(publicacion => publicacion.fecha_publicacion);

      const conteoPublicacionesPorAño = publicacionesValidas.reduce((acc, publicacion) => {
        const año = new Date(publicacion.fecha_publicacion).getFullYear();

        acc[año] = (acc[año] || 0) + 1;
        return acc;
      }, {});

      const ctx = document.getElementById("publicacionesPorAño") as HTMLCanvasElement;

      if (!ctx) {
        console.error("❌ Error: No se encontró el canvas 'publicacionesPorAño'");
        return;
      }

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      this.chartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: Object.keys(conteoPublicacionesPorAño).sort(),
          datasets: [{
            label: "Cantidad de publicaciones por año",
            data: Object.values(conteoPublicacionesPorAño),
            borderColor: "#007bff",
            backgroundColor: "rgba(0, 123, 255, 0.2)",
            borderWidth: 2,
            pointBackgroundColor: "#007bff",
            pointBorderColor: "#000"
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true, position: "top" }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: "Cantidad de publicaciones" } },
            x: { title: { display: true, text: "Año" } }
          }
        }
      });
    });
  }

}