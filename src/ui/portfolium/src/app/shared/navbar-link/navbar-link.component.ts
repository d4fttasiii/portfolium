import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

export interface NavbarLink {
  label: string;
  icon?: string;
  route: string;
}

@Component({
  selector: 'port-navbar-link',
  templateUrl: './navbar-link.component.html',
  styleUrls: ['./navbar-link.component.scss'],
})
export class NavbarLinkComponent implements OnInit {
  @Input() link: NavbarLink;
  @Output() navigated = new EventEmitter<void>();

  isActive: boolean;

  constructor(
    private router: Router,
    private activateRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activateRoute.url.subscribe(url => {
      const joined = url.join();
      console.log(url);
      this.isActive = joined.includes(this.link.route);
    });
  }

  navigateTo() {
    this.navigated.emit();
    this.router.navigate(['/', ...this.link.route.split('/')]);
  }
}
