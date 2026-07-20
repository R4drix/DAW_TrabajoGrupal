import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { User } from './models';

@Service()
export class LoginService {
    private readonly url = '';
    private http = inject(HttpClient);
    //Por mienstras user sera
    public user: User | null = {
        'email': 'abc@gmail.com',
        'membresia': 'nose',
        'nombre': 'Shy',
        'reservasActivas': 'mmm'
    };

    public isLogged = signal<Boolean>(true);

    public login(username: string, password: string) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        return this.http.post(this.url, formData)
    }
    public logout() {
        this.isLogged.set(false);
    }

}
