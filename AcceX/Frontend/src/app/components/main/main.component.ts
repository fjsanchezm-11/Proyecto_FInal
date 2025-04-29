import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {

  constructor(private router: Router) {}

  logout() {
    localStorage.setItem('isLoggedIn', 'false');
    this.router.navigate(['/login']);
  }

  goToUsuarios() {
    this.router.navigate(['/usuario']);
  }

  goToProyectos() {
    this.router.navigate(['/proyectos']);
  }

  goToInvestigadores() {
    this.router.navigate(['/investigadores']);
  }

  goToPublicaciones() {
    this.router.navigate(['/publicaciones']);
  }
  goToGrupos() {
    this.router.navigate(['/grupos']);
  }
}
