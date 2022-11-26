import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: 'trading',
    loadChildren: () =>
      import('./trading/trading.module').then((m) => m.TradingModule),
  },
  {
    path: 'management',
    loadChildren: () =>
      import('./manager/manager.module').then((m) => m.ManagerModule),
  },
  {
    path: 'synthetic',
    loadChildren: () =>
      import('./synthetic/synthetic.module').then((m) => m.SyntheticModule),
  },
  {
    path: 'treasury',
    loadChildren: () =>
      import('./treasury/treasury.module').then((m) => m.TreasuryModule),
  },
  {
    path: 'mirrored',
    loadChildren: () =>
      import('./mirrored/mirrored.module').then((m) => m.MirroredModule),
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
