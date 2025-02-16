import { Component } from '@angular/core';
import {AuthService} from '../core/service/auth.service';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    NgIf
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (response) => {
        this.authService.saveToken(response.token);
        this.router.navigate(['/all-books']);
      },
      error: () => {
        this.errorMessage = 'Invalid username or password';
      }
    });
  }
}
