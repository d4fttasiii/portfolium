import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'port-icon-button',
  templateUrl: './icon-button.component.html',
  styleUrls: ['./icon-button.component.scss'],
})
export class IconButtonComponent {
  @Input({ required: false }) color?: string = 'primary';
  @Input({ required: false }) isDisabled?: boolean = false;
  @Input({ required: true }) icon: string;
  @Output() clicked = new EventEmitter<void>();

  handleClicked() {
    this.clicked.emit();
  }
}
