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
  private login = inject(LoginService)

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

    this.login.login(this.username, this.password).subscribe({
      next: (res) => {
        this.login.isLogged = true;
        console.log('Se logueo ....(logica)');
        
      },
      error: (err) => {
        console.log('Ocurrio un error', err);
        
      }
    })
  }
}
