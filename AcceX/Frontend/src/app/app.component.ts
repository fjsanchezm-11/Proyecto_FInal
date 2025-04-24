import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'AcceX';
  isLoggedIn = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/main']);
    }
  }

  logout() {
    localStorage.setItem('isLoggedIn', 'false');
    this.router.navigate(['/login']);
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: Event) {
    localStorage.setItem('isLoggedIn', 'false');
  }
}
