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
    console.log('esto click', data);

  }
  stopEdit(data: any): void {
    this.editId = null;
    const user = this.userService.putUser(data)

    console.log('esto recibo', user);
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

  }

  onCheckboxChange(event: any, data: any): void {
    // Comprueba si la casilla de verificación fue marcada o desmarcada
    const isChecked = event.target.checked;

    // Realiza acciones basadas en el estado de la casilla de verificación
    if (isChecked) {
      console.log('Casilla de verificación marcada', data);
      // Aquí puedes llamar a otra función o realizar acciones cuando la casilla de verificación es marcada
    } else {
      console.log('Casilla de verificación desmarcada', data);
      // Aquí puedes llamar a otra función o realizar acciones cuando la casilla de verificación es desmarcada
    }
  }
}