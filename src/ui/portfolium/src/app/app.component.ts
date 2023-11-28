import { Component } from '@angular/core';

import { NavbarLink } from './shared/navbar-link/navbar-link.component';

@Component({
  selector: 'port-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  links: NavbarLink[] = [
    {
      label: 'Dashboard',
      route: 'dashboard',
    },
    {
      label: 'Invest',
      route: 'invest',
    },
    {
      label: 'About',
      route: 'about',
    },
    {
      label: 'Voting',
      route: 'voting',
    },
  ];
}
