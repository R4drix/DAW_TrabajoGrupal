import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgClass } from '@angular/common'; // <-- Agregamos NgClass aquí
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, NgIf, NgClass], // <-- Agregamos NgClass a los imports
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css'
})
export class AdminLogin {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false; 
  
  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  togglePasswordVisiblity() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor, rellene todos los campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const adminData = await this.api.loginAdministrador(this.username, this.password);
      localStorage.setItem('cataga_admin_user', adminData.usuario);
      localStorage.setItem('cataga_admin_role', adminData.rol || 'admin');
      this.router.navigate(['/admin/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Credenciales incorrectas.';
    } finally {
      this.isLoading = false;
    }
  }
}