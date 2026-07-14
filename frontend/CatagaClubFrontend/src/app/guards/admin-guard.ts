import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Capturamos EXACTAMENTE lo que hay en el disco del navegador
  const adminLogueado = localStorage.getItem('cataga_admin_user');

  // 🔥 PRUEBA DE FUEGO: Esto lanzará un pop-up en tu navegador apenas intentes entrar
  alert('¡El Guard se disparó! El valor en localStorage es: ' + adminLogueado);

  // Si por alguna razón la prueba anterior te da paso, es porque "adminLogueado" no es null ni vacío.
  if (adminLogueado && adminLogueado !== null && adminLogueado !== 'null' && adminLogueado !== 'undefined' && adminLogueado.trim() !== '') {
    return true; // Déjalo pasar
  } else {
    // Si no hay nadie, limpiamos todo y rebotamos al login
    localStorage.clear(); 
    router.navigate(['/admin/login']);
    return false; // BLOQUEADO
  }
};