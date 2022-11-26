import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

import { MenuItem } from '@core/models/menu-item';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  @ViewChild(MatSidenav)
  sidenav!: MatSidenav;
  menuItems: MenuItem[];

  ngOnInit(): void {
    this.menuItems = [
      {
        icon: 'fa-gauge',
        label: 'Dashboard',
        route: 'dashboard',
      },
      {
        icon: 'fa-arrow-right-arrow-left',
        label: 'Trading',
        route: 'trading',
      },
      {
        icon: 'fa-user-tie',
        label: 'Management',
        route: 'management',
      },
      {
        icon: 'fa-flask',
        label: 'Synthetics',
        route: 'synthetic',
      },
      {
        icon: 'fa-vials',
        label: 'Mirrored',
        route: 'mirrored',
      },
      {
        icon: 'fa-clock-rotate-left',
        label: 'Cron',
        route: 'cron',
      },
      {
        icon: 'fa-gem',
        label: 'Treasury',
        route: 'treasury',
      },
    ];
  }

  ngAfterViewInit() {
    this.sidenav.mode = 'over';
    this.sidenav.close();
  }
}
