import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'port-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  @Input({ required: false }) color?: string = 'primary';
  @Input({ required: false }) isDisabled?: boolean = false;
  @Output() clicked = new EventEmitter<void>();

  handleClicked() {
    this.clicked.emit();
  }
}
