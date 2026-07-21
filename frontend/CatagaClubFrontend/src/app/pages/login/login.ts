import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login-service';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, NgIf, NgClass],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false;

  private router = inject(Router);
  private login = inject(LoginService);

  togglePasswordVisiblity() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor, rellene todos los campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.login.login(this.username, this.password).subscribe({
      next: (res) => {
        if (res.ok && res.user && res.user.is_staff) {
          this.login.user = res.user;
          this.login.isLogged.set(true);
          this.router.navigate(['/admin']);
        } else {
          this.errorMessage =
            res.error || 'No tiene permisos de administrador.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        const backendMsg = err?.error?.error;
        this.errorMessage =
          backendMsg ||
          (err.status === 0
            ? 'No se pudo conectar con el servidor.'
            : 'Error al iniciar sesión.');
        this.isLoading = false;
      },
    });
  }
}
