import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminCertificacionesService, Certificacion } from '../../../services/admin-certificaciones.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-certificaciones-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './certificaciones-lista.component.html',
  styleUrls: ['./certificaciones-lista.component.css']
})
export class CertificacionesListaComponent implements OnInit {
  certificaciones: Certificacion[] = [];
  loading = false;
  searchTerm = '';
  private searchSubject = new Subject<string>();
  
  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  perPage = 9; // Para mostrar en grid 3x3
  
  // Selección múltiple
  selectedIds: Set<string> = new Set();
  selectAll = false;
  
  // Modal
  showModal = false;
  editingCertificacion: Certificacion | null = null;
  
  // Form
  formData = {
    nombre: '',
    institucion_emisora: '',
    descripcion: ''
  };
  submitting = false;
  
  // Delete confirmation
  showDeleteConfirm = false;
  deletingId: string | null = null;

  // Math para template
  Math = Math;

  constructor(
    private certificacionesService: AdminCertificacionesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCertificaciones();
    
    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadCertificaciones();
    });
  }

  loadCertificaciones(): void {
    this.loading = true;
    this.certificacionesService.getCertificaciones({
      page: this.currentPage,
      per_page: this.perPage,
      search: this.searchTerm || undefined
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.certificaciones = response.data.certificaciones;
          this.currentPage = response.data.meta.current_page;
          this.totalPages = response.data.meta.total_pages;
          this.totalCount = response.data.meta.total_count;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar certificaciones:', error);
        this.loading = false;
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCertificaciones();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCertificaciones();
    }
  }

  openCreateModal(): void {
    this.editingCertificacion = null;
    this.formData = {
      nombre: '',
      institucion_emisora: '',
      descripcion: ''
    };
    this.showModal = true;
  }

  openEditModal(certificacion: Certificacion): void {
    this.editingCertificacion = certificacion;
    this.formData = {
      nombre: certificacion.nombre,
      institucion_emisora: certificacion.institucion_emisora || '',
      descripcion: certificacion.descripcion || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCertificacion = null;
    this.formData = {
      nombre: '',
      institucion_emisora: '',
      descripcion: ''
    };
  }

  saveCertificacion(): void {
    if (!this.formData.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    this.submitting = true;

    if (this.editingCertificacion) {
      // Editar
      this.certificacionesService.updateCertificacion(
        this.editingCertificacion.id,
        { certificacion: this.formData }
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadCertificaciones();
            this.closeModal();
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al actualizar:', error);
          alert('Error al actualizar la certificación');
          this.submitting = false;
        }
      });
    } else {
      // Crear
      this.certificacionesService.createCertificacion({
        certificacion: this.formData
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadCertificaciones();
            this.closeModal();
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al crear:', error);
          alert('Error al crear la certificación');
          this.submitting = false;
        }
      });
    }
  }

  confirmDelete(id: string): void {
    this.deletingId = id;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deletingId = null;
  }

  deleteCertificacion(): void {
    if (!this.deletingId) return;

    this.certificacionesService.deleteCertificacion(this.deletingId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadCertificaciones();
          this.cancelDelete();
        }
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la certificación');
      }
    });
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.updateSelectAll();
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.certificaciones.forEach(cert => this.selectedIds.add(cert.id));
    } else {
      this.selectedIds.clear();
    }
  }

  updateSelectAll(): void {
    this.selectAll = this.certificaciones.length > 0 && 
                     this.certificaciones.every(cert => this.selectedIds.has(cert.id));
  }

  bulkDelete(): void {
    if (this.selectedIds.size === 0) {
      alert('Seleccione al menos una certificación');
      return;
    }

    if (!confirm(`¿Está seguro de eliminar ${this.selectedIds.size} certificación(es)?`)) {
      return;
    }

    this.certificacionesService.bulkDelete(Array.from(this.selectedIds)).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedIds.clear();
          this.selectAll = false;
          this.loadCertificaciones();
        }
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar certificaciones');
      }
    });
  }
}
