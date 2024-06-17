import { Component, inject } from '@angular/core';
import { UserService } from '../../../services/user.service'
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-lista',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './lista.component.html',
  styleUrl: './lista.component.css'
})
export class ListaComponent {
  private readonly userService = inject(UserService);
  users = this.userService.getUsers();
}
