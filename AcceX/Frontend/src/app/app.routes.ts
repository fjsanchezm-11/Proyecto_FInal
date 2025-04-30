import { bootstrapApplication } from '@angular/platform-browser';
import { Routes } from '@angular/router';
import { UsuarioComponent } from './components/usuario/usuario.component';
import { ProyectosComponent } from './components/proyectos/proyectos.component';
import { MainComponent } from './components/main/main.component';
import { InvestigadoresComponent } from './components/investigadores/investigadores.component';
import { PublicacionesComponent } from './components/publicaciones/publicaciones.component';
import { GruposComponent } from './components/grupos/grupos.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/main/usuario', pathMatch: 'full' },
  { 
    path: 'main', 
    component: MainComponent,
    children: [
      { path: 'usuario', component: UsuarioComponent },
      { path: 'proyectos', component: ProyectosComponent },
      { path: 'investigadores', component: InvestigadoresComponent },
      { path: 'publicaciones', component: PublicacionesComponent },
      { path: 'grupos', component: GruposComponent }
    ]
  },
  { path: '**', redirectTo: '/main/usuario' }
];
