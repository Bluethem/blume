import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminMedicosService, MedicoListItem } from '../../../services/admin-medicos.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-medicos-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medicos-lista.component.html',
  styleUrls: ['./medicos-lista.component.css']
})
export class MedicosListaComponent implements OnInit {
  private medicosService = inject(AdminMedicosService);
  private router = inject(Router);
  
  medicos: MedicoListItem[] = [];
  loading = true;
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedMedicoId: string | null = null;
  
  // Búsqueda y filtros
  searchTerm = '';
  private searchSubject = new Subject<string>();
  
  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  perPage = 10;
  
  ngOnInit(): void {
    this.cargarMedicos();
    this.setupSearch();
  }
  
  setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.currentPage = 1;
      this.cargarMedicos();
    });
  }
  
  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }
  
  cargarMedicos(): void {
    this.loading = true;
    this.medicosService.getMedicos(
      this.currentPage,
      this.perPage,
      this.searchTerm || undefined
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.medicos = response.data.medicos;
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
  
  toggleEstado(medico: MedicoListItem, event: Event): void {
    event.preventDefault();
    
    this.medicosService.toggleEstado(medico.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          medico.activo = response.data.activo;
        }
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        // Revertir el cambio visual si falla
        medico.activo = !medico.activo;
      }
    });
  }
  
  openCreateModal(): void {
    this.router.navigate(['/admin/medicos/crear']);
  }
  
  verMedico(medico: MedicoListItem): void {
    this.router.navigate(['/admin/medicos/ver', medico.id]);
  }
  
  openEditModal(medico: MedicoListItem): void {
    this.router.navigate(['/admin/medicos/editar', medico.id]);
  }
  
  closeModal(): void {
    this.showModal = false;
    this.selectedMedicoId = null;
  }
  
  onMedicoSaved(): void {
    this.closeModal();
    this.cargarMedicos();
  }
  
  deleteMedico(medico: MedicoListItem): void {
    if (!confirm(`¿Está seguro que desea desactivar al médico ${medico.nombre_completo}?`)) {
      return;
    }
    
    this.medicosService.deleteMedico(medico.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.cargarMedicos();
        }
      },
      error: (error) => {
        console.error('Error al eliminar médico:', error);
      }
    });
  }
  
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cargarMedicos();
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
    // TODO: Implementar exportación a Excel
    console.log('Exportar a Excel');
  }
}
