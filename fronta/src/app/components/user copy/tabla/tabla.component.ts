import { Component, inject } from '@angular/core';

import { NzTableModule } from 'ng-zorro-antd/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { RouterOutlet } from '@angular/router';
import { User } from '../../../shared/models/user';
import { NzFormModule } from 'ng-zorro-antd/form';

import { UserService } from '../../../services/user.service'




@Component({
  selector: 'app-tabla-user',
  standalone: true,
  imports: [
    NzFormModule,
    NzTableModule,
    FormsModule,
    CommonModule,
    NzPopconfirmModule,
    NzPopoverModule,
    RouterOutlet
  ],
  templateUrl: './tabla.component.html',
  styleUrl: './tabla.component.css'
})

export class TablaComponentUs {

  private readonly userService = inject(UserService);
  users = this.userService.users;

  i = 0;
  editId: String | null = null;
  listOfData: User[] = [];

  startEdit(email: String): void {
    this.editId = email;
  }

  stopEdit(): void {
    this.editId = null;
  }

  addRow(): void {
    this.listOfData = [
      ...this.listOfData,
      {
        _id: "",
        nameUser: '',
        email: '',
        pass: '',
        role: {
          admin: false,
          seller: false
        },
        active: false,
      }
    ];
    this.i++;
  }

  deleteRow(email: String): void {

    this.users.update(((users: User[]) => users.filter((user: User) => user.email !== email)));
  }
}