import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterModule,CommonModule,FormsModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {

  password: string = '';
  loginError: boolean = false;
  menuAbierto = false;
  isMobile = false;

  constructor(public authService: AuthService,private router: Router,private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;

    if (this.isMobile) {
      this.menuAbierto = false; // 🔧 en móvil, empezar cerrado
    } else {
      this.menuAbierto = true; // 🔧 en escritorio, siempre abierto
    }
  }

  login() {
    const success = this.authService.login(this.password);
    this.loginError = !success;
    if (success) this.password = '';
  }

  logout() {
    localStorage.setItem('isLoggedIn', 'false');
    this.authService.logout();
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
