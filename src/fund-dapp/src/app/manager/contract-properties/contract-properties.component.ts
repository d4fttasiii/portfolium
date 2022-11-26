import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MutableContractProperties } from '@core/models/mutable-contract-properties';

@Component({
  selector: 'app-contract-properties',
  templateUrl: './contract-properties.component.html',
  styleUrls: ['./contract-properties.component.scss'],
})
export class ContractPropertiesComponent implements OnInit {
  @Input() mutableProperties: MutableContractProperties;

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {}

  submit() {
    this.snackBar.open('Changes saved!', 'OK', { duration: 2500 });
  }
}
