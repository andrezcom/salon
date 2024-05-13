import { Component, inject } from '@angular/core';
import { UserService } from '../../../services/user.Service'
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-lista',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './lista.component.html',
  styleUrl: './lista.component.css'
})
export class ListaComponent {
  private readonly userSWC = inject(UserService);
  users = this.userSWC.users;
}
