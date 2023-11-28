import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AddressBoxComponent } from './address-box/address-box.component';
import { BadgeComponent } from './badge/badge.component';
import { ButtonComponent } from './button/button.component';
import { IconButtonComponent } from './icon-button/icon-button.component';
import { InputComponent } from './input/input.component';
import { NavbarLinkComponent } from './navbar-link/navbar-link.component';
import { NavbarComponent } from './navbar/navbar.component';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { TableComponent } from './table/table.component';
import { CardComponent } from './card/card.component';
import { MetricBoxComponent } from './metric-box/metric-box.component';

const COMPONENTS = [
  CardComponent,
  InputComponent,
  IconButtonComponent,
  NavbarComponent,
  ButtonComponent,
  AddressBoxComponent,
  TableComponent,
  BadgeComponent,
  SpinnerComponent,
  ProgressBarComponent,
  MetricBoxComponent,
];

@NgModule({
  declarations: [...COMPONENTS, NavbarLinkComponent],
  imports: [CommonModule, FormsModule],
  exports: [FormsModule, ...COMPONENTS],
})
export class SharedModule {}
