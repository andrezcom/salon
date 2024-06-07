import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzFormModule } from 'ng-zorro-antd/form';

import { User } from '../../../shared/models/user';
import { UserService } from '../../../services/user.service'
import { ValidationErrors } from '../../../shared/validtors';

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
  private readonly validationErrors = inject(ValidationErrors)
  users = this.userService.users;

  i = 0;
  editId: String | null = null;


  startEdit(data: any): void {
    this.editId = data._id;
    console.log('start: ', this.validationErrors.founded(data.email));
  }
  stopEdit(data: any): void {
    this.editId = null;
    console.log('stop: ', this.validationErrors.founded(data.email));
    this.userService.putUser(data)
  }
  addRow(): void {

  }

  deleteRow(_id: String): void {
    this.users.update(((users: User[]) => users.filter((user: User) => user._id !== _id)));
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