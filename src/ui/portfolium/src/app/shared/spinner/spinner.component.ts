import { Component, Input } from '@angular/core';

@Component({
  selector: 'port-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
})
export class SpinnerComponent {
  @Input({ required: false }) size?: 's' | 'm' | 'l' | 'xl' = 's';
}
