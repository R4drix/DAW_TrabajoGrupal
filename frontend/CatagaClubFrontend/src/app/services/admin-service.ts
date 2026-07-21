import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

@Service()
export class AdminService {
    private readonly url = '';
    private http = inject(HttpClient);

    public actualizarHabitacion(id: number, data: any) {
    //No se que se manda con put :v
        return this.http.put(this.url, id /* ??? */)
    }
    getHabitaciones() {
        return this.http.get('http://localhost:8000/club/api/estado-habitaciones/');
    }
}
