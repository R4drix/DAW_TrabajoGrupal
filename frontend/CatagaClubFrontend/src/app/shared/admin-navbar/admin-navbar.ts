import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-navbar.html',
  styleUrl: './admin-navbar.css'
})
export class AdminNavbar {

  constructor(private router: Router) {}

  verComoUsuario() {
    this.router.navigate(['/']);
  }

  logout() {
    localStorage.removeItem('cataga_admin_user');
    localStorage.removeItem('cataga_admin_role');
    this.router.navigate(['/admin/login']);
  }
}