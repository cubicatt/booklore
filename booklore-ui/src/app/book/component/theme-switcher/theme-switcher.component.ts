import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {DropdownChangeEvent, DropdownModule} from 'primeng/dropdown';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  standalone: true,
  imports: [
    FormsModule,
    DropdownModule
  ],
  styleUrl: './theme-switcher.component.scss'
})
export class ThemeSwitcherComponent implements OnInit {
  themes: { value: string; label: string }[] = [];
  currentTheme: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<{ value: string; label: string }[]>('assets/themes/themes.json')
      .subscribe(
        (data) => {
          this.themes = data;
          const savedTheme = localStorage.getItem('selected-theme');
          if (savedTheme) {
            this.currentTheme = savedTheme;
            this.applyTheme(savedTheme);
          } else if (this.themes.length > 0) {
            this.currentTheme = this.themes[0].value;
            this.applyTheme(this.currentTheme);
          }
        },
        (error) => {
          console.error('Error loading themes:', error);
        }
      );
  }

  changeTheme(event: DropdownChangeEvent) {
    const selectedTheme = event.value;
    this.currentTheme = selectedTheme;
    this.applyTheme(selectedTheme);
    localStorage.setItem('selected-theme', selectedTheme);
  }

  private applyTheme(theme: string) {
    const themeLink = document.getElementById('theme-link') as HTMLLinkElement;
    if (themeLink) {
      themeLink.href = `assets/layout/styles/theme/${theme}/theme.css`;
    } else {
      console.error('Theme link element not found!');
    }
  }
}
