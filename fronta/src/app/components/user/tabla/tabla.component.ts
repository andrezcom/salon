import { Component, inject } from '@angular/core';

import { NzTableModule } from 'ng-zorro-antd/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { RouterOutlet } from '@angular/router';
import { User, newUser } from '../../../shared/models/user';
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

  startEdit(data: any): void {
    this.editId = data._id;
  }
  stopEdit(data: any): void {
    this.editId = null;
    const user = this.userService.putUser(data)
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

  deleteRow(_id: String): void {
    this.users.update(((users: User[]) => users.filter((user: User) => user.email !== _id)));
    const user = this.userService.deleteUser(_id)

  }

  onCheckboxChange(event: any, data: any, place: String): void {
    // Comprueba si la casilla de verificación fue marcada o desmarcada
    const isChecked = event.target.checked;
    if (place === 'admin') data.role.admin = isChecked;
    if (place === 'seller') data.role.seller = isChecked;
    if (place === 'active') data.active = isChecked;
    console.log('esta es mi data', data);

    this.stopEdit(data);
  }
}