import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortAddress',
})
export class ShortAddressPipe implements PipeTransform {
  transform(value: string, length = 6): unknown {
    if (!value) {
      return '';
    }
    return `${value.substring(0, length)}...${value.substring(
      value.length - (length - 2),
    )}`;
  }
}
