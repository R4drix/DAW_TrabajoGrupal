import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

@Service()
export class LoginService {
    private readonly url = '';
    private http = inject(HttpClient);

    public isLogged: Boolean = false;

    public login(user: string, password: string) {
        //Ayuda aqui no se que se hace
        return this.http.get(this.url)
    }
}
