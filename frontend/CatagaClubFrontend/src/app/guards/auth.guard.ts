import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../services/login-service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(LoginService);
  const router = inject(Router);

  if (auth.isLogged()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
