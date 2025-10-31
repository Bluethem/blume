import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminPacientesService, PacienteListItem } from '../../../services/admin-pacientes.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-pacientes-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes-lista.component.html',
  styleUrls: ['./pacientes-lista.component.css']
})
export class PacientesListaComponent implements OnInit {
  private pacientesService = inject(AdminPacientesService);
  private router = inject(Router);
  
  // Hacer Math disponible en el template
  Math = Math;
  
  pacientes: PacienteListItem[] = [];
  loading = true;
  
  // Selección múltiple
  selectedPacientes = new Set<string>();
  selectAll = false;
  
  // Búsqueda y filtros
  searchTerm = '';
  private searchSubject = new Subject<string>();
  
  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  perPage = 10;
  
  ngOnInit(): void {
    this.cargarPacientes();
    this.setupSearch();
  }
  
  setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.currentPage = 1;
      this.cargarPacientes();
    });
  }
  
  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }
  
  cargarPacientes(): void {
    this.loading = true;
    this.pacientesService.getPacientes(
      this.currentPage,
      this.perPage,
      this.searchTerm || undefined
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pacientes = response.data.pacientes;
          this.currentPage = response.data.meta.current_page;
          this.totalPages = response.data.meta.total_pages;
          this.totalCount = response.data.meta.total_count;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
  
  // Selección múltiple
  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectAll = checked;
    
    if (checked) {
      this.pacientes.forEach(p => this.selectedPacientes.add(p.id));
    } else {
      this.selectedPacientes.clear();
    }
  }
  
  toggleSelectPaciente(pacienteId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    
    if (checked) {
      this.selectedPacientes.add(pacienteId);
    } else {
      this.selectedPacientes.delete(pacienteId);
      this.selectAll = false;
    }
  }
  
  isPacienteSelected(pacienteId: string): boolean {
    return this.selectedPacientes.has(pacienteId);
  }
  
  get hasSelectedPacientes(): boolean {
    return this.selectedPacientes.size > 0;
  }
  
  get selectedCount(): number {
    return this.selectedPacientes.size;
  }
  
  // Bulk Actions
  bulkActivate(): void {
    if (!confirm(`¿Activar ${this.selectedCount} pacientes seleccionados?`)) return;
    
    const promises = Array.from(this.selectedPacientes).map(id => {
      const paciente = this.pacientes.find(p => p.id === id);
      if (paciente && !paciente.activo) {
        return this.pacientesService.toggleEstado(id).toPromise();
      }
      return Promise.resolve();
    });
    
    Promise.all(promises).then(() => {
      this.selectedPacientes.clear();
      this.selectAll = false;
      this.cargarPacientes();
    });
  }
  
  bulkDeactivate(): void {
    if (!confirm(`¿Desactivar ${this.selectedCount} pacientes seleccionados?`)) return;
    
    const promises = Array.from(this.selectedPacientes).map(id => {
      const paciente = this.pacientes.find(p => p.id === id);
      if (paciente && paciente.activo) {
        return this.pacientesService.toggleEstado(id).toPromise();
      }
      return Promise.resolve();
    });
    
    Promise.all(promises).then(() => {
      this.selectedPacientes.clear();
      this.selectAll = false;
      this.cargarPacientes();
    });
  }
  
  bulkDelete(): void {
    if (!confirm(`¿Eliminar ${this.selectedCount} pacientes seleccionados? Esta acción no se puede deshacer.`)) return;
    
    const promises = Array.from(this.selectedPacientes).map(id => {
      return this.pacientesService.deletePaciente(id).toPromise();
    });
    
    Promise.all(promises).then(() => {
      this.selectedPacientes.clear();
      this.selectAll = false;
      this.cargarPacientes();
    });
  }
  
  // Toggle estado individual
  toggleEstado(paciente: PacienteListItem, event: Event): void {
    event.preventDefault();
    
    this.pacientesService.toggleEstado(paciente.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          paciente.activo = response.data.activo;
        }
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        paciente.activo = !paciente.activo;
      }
    });
  }
  
  // Navegación
  verPaciente(paciente: PacienteListItem): void {
    this.router.navigate(['/admin/pacientes/ver', paciente.id]);
  }
  
  editarPaciente(paciente: PacienteListItem): void {
    this.router.navigate(['/admin/pacientes/editar', paciente.id]);
  }
  
  crearPaciente(): void {
    this.router.navigate(['/admin/pacientes/crear']);
  }
  
  deletePaciente(paciente: PacienteListItem): void {
    if (!confirm(`¿Está seguro que desea desactivar al paciente ${paciente.nombre_completo}?`)) {
      return;
    }
    
    this.pacientesService.deletePaciente(paciente.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.cargarPacientes();
        }
      },
      error: (error) => {
        console.error('Error al eliminar paciente:', error);
      }
    });
  }
  
  // Paginación
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cargarPacientes();
    }
  }
  
  get pages(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  exportToExcel(): void {
    console.log('Exportar a Excel');
  }
}
