import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service'

import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { ReactiveFormsModule } from '@angular/forms';

import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule
  ],

})
export class LoginComponent {
  validateForm: FormGroup<{
    nameUser: FormControl<string>;
    pass: FormControl<string>;
    remember: FormControl<boolean>;
  }> = this.fb.group({
    nameUser: ['', [Validators.required]],
    pass: ['', [Validators.required]],
    remember: [true]
  });

  private readonly userService = inject(UserService);
  submitForm(): void {

    /* this.validateForm.reset();
    console.log('submit que envio?:  ', this.validateForm.value);
    console.log('submit compo', user); */


    if (this.validateForm.valid) {
      console.log('submit envio', this.validateForm.value);
      const user = this.userService.loginUser(this.validateForm.value)
      console.log(user);

    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  logOut() {
    localStorage.removeItem('token')
  }
  constructor(private fb: NonNullableFormBuilder) { }
}
