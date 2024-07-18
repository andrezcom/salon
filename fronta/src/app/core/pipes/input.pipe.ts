import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sanitizar',
  standalone: true
})
export class InputPipe implements PipeTransform {

  transform(value: string): string {
    return value.replace(/[<>/"'`;{}]/g, '')
  }

}
