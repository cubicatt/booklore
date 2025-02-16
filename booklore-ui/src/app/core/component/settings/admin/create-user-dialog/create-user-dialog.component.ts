import {Component, inject, OnInit} from '@angular/core';
import {InputText} from 'primeng/inputtext';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Checkbox} from 'primeng/checkbox';
import {MultiSelectModule} from 'primeng/multiselect';
import {Library} from '../../../../../book/model/library.model';
import {Button} from 'primeng/button';
import {LibraryService} from '../../../../../book/service/library.service';
import {UserService} from '../../../../../user.service';
import {MessageService} from 'primeng/api';
import {DynamicDialogRef} from 'primeng/dynamicdialog';

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [
    InputText,
    ReactiveFormsModule,
    FormsModule,
    Checkbox,
    MultiSelectModule,
    Button
  ],
  templateUrl: './create-user-dialog.component.html',
  styleUrl: './create-user-dialog.component.scss'
})
export class CreateUserDialogComponent implements OnInit {
  libraries: Library[] = [];
  selectedLibraries: Library[] = [];

  username: string = '';
  password: string = '';
  name: string = '';
  email: string = '';
  canUpload: boolean = false;
  canDownload: boolean = false;
  canEditMetadata: boolean = false;

  private libraryService = inject(LibraryService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private ref = inject(DynamicDialogRef);

  ngOnInit() {
    this.libraries = this.libraryService.getLibrariesFromState();
  }

  createUser() {
    if (!this.username || this.password.length < 6 || !this.name || !this.email || this.selectedLibraries.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly.'
      });
      return;
    }

    const userData = {
      username: this.username,
      password: this.password,
      name: this.name,
      email: this.email,
      permissionUpload: this.canUpload,
      permissionDownload: this.canDownload,
      permissionEditMetadata: this.canEditMetadata
    };

    this.userService.createUser(userData).subscribe({
      next: response => {
        this.messageService.add({
          severity: 'success',
          summary: 'User Created',
          detail: response.message
        });
        this.ref.close(true);
      },
      error: err => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create user: ' + err.error.message
        });
      }
    });
  }
}
