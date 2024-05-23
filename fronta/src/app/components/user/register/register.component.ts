import { Component, inject } from '@angular/core';
import { UserService } from '../../../services/user.service';

import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message'
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { Observable, Observer } from 'rxjs';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',

  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [NzCheckboxModule, ReactiveFormsModule, NzInputModule, NzFormModule]
})
export class RegisterComponent {
  validateForm: FormGroup<{
    nameUser: FormControl<string>;
    email: FormControl<string>;
    pass: FormControl<string>;
    confirm: FormControl<string>;
    admin: FormControl<boolean>;
    seller: FormControl<boolean>;
  }>;

  private readonly userService = inject(UserService);
  private nzMessageService = inject(NzMessageService);

  submitForm(): void {
    const user = this.userService.registerUser(this.validateForm.value)
    this.validateForm.reset();
    this.nzMessageService.create("success", `Usuario creado con éxito`);
    console.log('submit', this.validateForm.value);
    console.log('submit compo', user);
  }

  resetForm(e: MouseEvent): void {
    e.preventDefault();
    this.validateForm.reset();
  }

  validateConfirmPassword(): void {
    setTimeout(() => this.validateForm.controls.confirm.updateValueAndValidity());
  }

  userNameAsyncValidator: AsyncValidatorFn = (control: AbstractControl) =>
    new Observable((observer: Observer<ValidationErrors | null>) => {
      setTimeout(() => {
        if (control.value === 'JasonWood') {
          // you have to return `{error: true}` to mark it as an error event
          observer.next({ error: true, duplicated: true });
        } else {
          observer.next(null);
        }
        observer.complete();
      }, 1000);
    });

  confirmValidator: ValidatorFn = (control: AbstractControl) => {
    if (!control.value) {
      return { error: true, required: true };
    } else if (control.value !== this.validateForm.controls.pass.value) {
      return { confirm: true, error: true };
    }
    return {};
  };

  constructor(private fb: NonNullableFormBuilder) {
    this.validateForm = this.fb.group({
      nameUser: ['', [Validators.required], [this.userNameAsyncValidator]],
      email: ['', [Validators.email, Validators.required]],
      pass: ['', [Validators.required]],
      confirm: ['', [this.confirmValidator]],
      admin: [false],
      seller: [false]
    });
  }

}
