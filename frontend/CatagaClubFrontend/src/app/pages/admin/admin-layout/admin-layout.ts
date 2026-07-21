import { Component, inject, HostListener, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { LoginService } from '../../../services/login-service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayoutComponent {
  public login = inject(LoginService);
  private router = inject(Router);

  public isOpenProfile = signal<boolean>(false);
  public sidebarCollapsed = signal<boolean>(false);

  public toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isOpenProfile.update((v) => !v);
  }

  public toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  public logout(): void {
    this.login.logout();
    this.router.navigate(['/home']);
  }

  @HostListener('document:click')
  public closeMenu(): void {
    this.isOpenProfile.set(false);
  }
}
