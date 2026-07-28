import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/planner', pathMatch: 'full' },
  { path: 'planner', loadComponent: () => import('./pages/planner').then(m => m.PlannerPage) },
  { path: 'catalog', loadComponent: () => import('./pages/catalog').then(m => m.CatalogPage) },
  { path: 'glossary', loadComponent: () => import('./pages/glossary').then(m => m.GlossaryPage) },
  { path: 'admin', loadComponent: () => import('./pages/admin').then(m => m.AdminPage) },
  { path: 'login', loadComponent: () => import('./pages/login').then(m => m.LoginPage) },
  { path: '**', loadComponent: () => import('./pages/not-found').then(m => m.NotFoundPage) },
];
