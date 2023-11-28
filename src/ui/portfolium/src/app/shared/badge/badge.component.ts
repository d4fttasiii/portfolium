import { Component, Input } from '@angular/core';

@Component({
  selector: 'port-badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss'],
})
export class BadgeComponent {
  @Input({ required: false }) color?: string = 'primary';
}
