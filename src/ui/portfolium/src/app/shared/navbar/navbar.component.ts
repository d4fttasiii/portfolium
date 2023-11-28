import { Component, Input } from '@angular/core';

import { NavbarLink } from '../navbar-link/navbar-link.component';

@Component({
  selector: 'port-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  @Input() links: NavbarLink[];
}
