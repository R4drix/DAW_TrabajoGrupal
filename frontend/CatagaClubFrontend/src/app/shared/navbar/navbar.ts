import { NgClass } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../services/login-service';
import { User } from '../../services/models';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, NgClass],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  public isOpenProfile = signal<Boolean>(false);
  public login = inject(LoginService)
  private router = inject(Router);

  public toggleMenu(event: Event): void {
    if (this.login.isLogged()) {
      event.stopPropagation();
      this.isOpenProfile.update((value) => !value);
    } else
      this.router.navigate(['/login'])
  }

  public logout() {
    
    this.login.logout();
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.isOpenProfile.set(false);
  }
}
