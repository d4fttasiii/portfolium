import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Input } from '@angular/core';
// import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'port-address-box',
  templateUrl: './address-box.component.html',
  styleUrls: ['./address-box.component.scss'],
})
export class AddressBoxComponent {
  @Input() address?: string;
  @Input() length?: number;

  constructor(
    // private snackBar: MatSnackBar,
    private clipboard: Clipboard
  ) {}

  copy() {
    this.clipboard.copy(this.address);
    // this.snackBar.open('Copied!', 'OK', { duration: 1500 });
  }
}
