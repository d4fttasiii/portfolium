import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'port-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss'],
})
export class ProgressBarComponent implements OnChanges {
  // @Input({ required: false }) indeterminate?: boolean = false;
  @Input() progress: number;

  width: string;

  ngOnChanges(changes: SimpleChanges): void {
    this.width = `${changes['progress'].currentValue}%`;
  }
}
