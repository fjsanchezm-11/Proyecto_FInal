import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {

  constructor(private router: Router,private activatedRoute: ActivatedRoute) {}

  logout() {
    localStorage.setItem('isLoggedIn', 'false');
    this.router.navigate(['/login']);
  }

  goToUsuarios() {
    this.router.navigate(['usuario'], { relativeTo: this.activatedRoute });
  }
  
  goToProyectos() {
    this.router.navigate(['proyectos'], { relativeTo: this.activatedRoute });
  }
  
  goToInvestigadores() {
    this.router.navigate(['investigadores'], { relativeTo: this.activatedRoute });
  }
  
  goToPublicaciones() {
    this.router.navigate(['publicaciones'], { relativeTo: this.activatedRoute });
  }
  
  goToGrupos() {
    this.router.navigate(['grupos'], { relativeTo: this.activatedRoute });
  }
}
