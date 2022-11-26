import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-metric-box',
  templateUrl: './metric-box.component.html',
  styleUrls: ['./metric-box.component.scss'],
})
export class MetricBoxComponent {
  @Input() title?: string;
  @Input() metric?: any;
  @Input() toCopy?: any;
  @Input() isLoading?: boolean;
  @Input() copyEnabled?: boolean;

  constructor(private snackBar: MatSnackBar, private clipboard: Clipboard) {}

  copy() {
    this.clipboard.copy(this.toCopy || this.metric);
    this.snackBar.open('Copied!', 'OK', { duration: 1500 });
  }
}
