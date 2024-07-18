import { Component, inject } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { InputPipe } from '../../../core/pipes/input.pipe';
import { sanitizer, validpass } from '../../../core/validators/validators'
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidatorFn,
  Validators
} from '@angular/forms';

import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [NzCheckboxModule, ReactiveFormsModule, NzInputModule, NzFormModule, InputPipe]
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


  submitForm(): void {

    const user = this.userService.registerUser(this.validateForm.value)
    this.validateForm.reset();
  }

  resetForm(e: MouseEvent): void {
    e.preventDefault();
    this.validateForm.reset();
  }

  validateConfirmPassword(): void {
    setTimeout(() => this.validateForm.controls.confirm.updateValueAndValidity());
  }



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
      nameUser: ['', [Validators.required, sanitizer()]],
      email: ['', [Validators.email, Validators.required, sanitizer()]],
      pass: ['', [Validators.required, sanitizer()]],
      confirm: ['', [this.confirmValidator, sanitizer(), validpass()]],
      admin: [false],
      seller: [false]
    });
  }

}
