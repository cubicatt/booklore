import {Component, inject, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Button} from 'primeng/button';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {CreateUserDialogComponent} from './create-user-dialog/create-user-dialog.component';
import {TableModule} from 'primeng/table';
import {NgIf, NgStyle} from '@angular/common';
import {User, UserService} from '../../../../user.service';
import {MessageService} from 'primeng/api';
import {Checkbox} from 'primeng/checkbox';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, Button, TableModule, NgIf, Checkbox, NgStyle],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  ref: DynamicDialogRef | undefined;
  private dialogService = inject(DialogService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);

  users: any[] = [];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data.map(user => ({
          ...user,
          isEditing: false,
        }));
      },
      error: () => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to fetch users'});
      },
    });
  }

  openCreateUserDialog() {
    this.ref = this.dialogService.open(CreateUserDialogComponent, {
      header: 'Create New User',
      modal: true,
      closable: true,
      style: {position: 'absolute', top: '15%'},
    });
    this.ref.onClose.subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  toggleEdit(user: any) {
    user.isEditing = !user.isEditing;
    if (!user.isEditing) {
      this.loadUsers();
    }
  }

  saveUser(user: any) {
    this.userService.updateUser(user.id, {
      name: user.name,
      email: user.email,
      permissions: user.permissions,
    }).subscribe({
      next: () => {
        user.isEditing = false;
        this.messageService.add({severity: 'success', summary: 'Success', detail: 'User updated successfully'});
      },
      error: () => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to update user'});
      },
    });
  }

  deleteUser(user: User) {
    if (confirm(`Are you sure you want to delete ${user.username}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.messageService.add({severity: 'success', summary: 'Success', detail: `User ${user.username} deleted successfully`});
          this.loadUsers();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || `Failed to delete user ${user.username}`,
          });
        }
      });
    }
  }
}
