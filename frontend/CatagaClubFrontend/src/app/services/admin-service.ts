import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';

@Service()
export class AdminService {
    private readonly url = `${environment.apiBaseUrl}/estado-habitaciones/`;
    private http = inject(HttpClient);

    public actualizarHabitacion(id: number, data: any) {
        return this.http.put(this.url, id);
    }
    getHabitaciones() {
        return this.http.get(this.url);
    }
}
