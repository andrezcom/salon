import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzFormModule } from 'ng-zorro-antd/form';

import { User } from '../../../shared/models/user';
import { UserService } from '../../../core/services/user.service'

import { InputPipe } from '../../../core/pipes/input.pipe'

@Component({
  selector: 'app-tabla-user',
  standalone: true,
  imports: [
    InputPipe,
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


  startEdit(data: any): void {
    this.editId = data._id;
  }
  stopEdit(data: User): void {
    this.editId = null;
    data.email = data.email.toLowerCase()
    this.userService.putUser(data)
  }
  addRow(): void {

  }

  deleteRow(_id: string): void {
    this.users.update(((users: User[]) => users.filter((user: User) => user._id !== _id)));
    const user = this.userService.deleteUser(_id)
  }

  onCheckboxChange(event: any, data: any, place: string): void {
    // Comprueba si la casilla de verificación fue marcada o desmarcada
    const isChecked = event.target.checked;
    if (place === 'admin') data.role.admin = isChecked;
    if (place === 'seller') data.role.seller = isChecked;
    if (place === 'active') data.active = isChecked;

    this.stopEdit(data);
  }
}