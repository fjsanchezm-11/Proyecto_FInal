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
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'usuario', component: UsuarioComponent, canActivate: [AuthGuard] },
  { path: 'proyectos', component: ProyectosComponent, canActivate: [AuthGuard] },
  { path: 'investigadores', component: InvestigadoresComponent, canActivate: [AuthGuard] },
  { path: 'publicaciones', component: PublicacionesComponent, canActivate: [AuthGuard] },
  { path: 'main', component: MainComponent, canActivate: [AuthGuard] },
  { path: 'grupos', component: GruposComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];
