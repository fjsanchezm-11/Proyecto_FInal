import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  password: string = '';
  correctPassword: string = 'admin123';

  constructor(private authService: AuthService,private router: Router) {}

  checkPassword() {
    if (this.password === this.correctPassword) {
      localStorage.setItem('isLoggedIn', 'true');
      this.router.navigate(['/main']);  
    } else {
      alert('Contraseña incorrecta');
    }
  } 
}
