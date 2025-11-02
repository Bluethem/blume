import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MedicoCitasService } from '../../../../services/medico-citas.service';
import { CitasService } from '../../../../services/citas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-costo-adicional',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agregar-costo-adicional.component.html',
  styles: []
})
export class AgregarCostoAdicionalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private medicoCitasService = inject(MedicoCitasService);
  private citasService = inject(CitasService);

  cita: any = null;
  citaId = '';
  loading = false;
  saving = false;

  form: FormGroup = this.fb.group({
    concepto: ['', [Validators.required, Validators.maxLength(120)]],
    monto: [null as any, [Validators.required, Validators.min(0.1)]]
  });

  conceptos = [
    'Procedimiento adicional',
    'Medicamentos',
    'Exámenes de laboratorio',
    'Radiografías',
    'Materiales e insumos',
    'Control adicional',
    'Otro'
  ];

  ngOnInit(): void {
    this.citaId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.citaId) {
      this.router.navigate(['/medico/citas']);
      return;
    }
    this.cargarCita();
  }

  cargarCita(): void {
    this.loading = true;
    this.medicoCitasService.getCita(this.citaId).subscribe({
      next: (resp: any) => {
        this.cita = resp?.data || null;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/medico/citas/detalle', this.citaId]);
      }
    });
  }

  seleccionarConcepto(c: string): void {
    this.form.patchValue({ concepto: c });
  }

  submit(): void {
    if (this.form.invalid || !this.cita) {
      this.form.markAllAsTouched();
      return;
    }

    const { monto, concepto } = this.form.value;

    Swal.fire({
      title: 'Confirmar cargo adicional',
      html: `\
        <div class="text-left">
          <p class="mb-2"><strong>Paciente:</strong> ${this.cita?.paciente?.nombre_completo || ''}</p>
          <p class="mb-2"><strong>Médico:</strong> ${this.cita?.medico?.nombre_profesional || this.cita?.medico_nombre || ''}</p>
          <p class="mb-2"><strong>Concepto:</strong> ${concepto}</p>
          <p class="mb-2"><strong>Monto:</strong> <span class="font-bold">S/ ${Number(monto).toFixed(2)}</span></p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Agregar cargo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#B71C1C'
    }).then(res => {
      if (res.isConfirmed) {
        this.procesarCargo(Number(monto), concepto);
      }
    });
  }

  private procesarCargo(monto: number, concepto: string): void {
    this.saving = true;
    this.citasService.agregarCostoAdicional(this.citaId, monto, concepto).subscribe({
      next: () => {
        this.saving = false;
        Swal.fire({
          title: '¡Cargo agregado!',
          text: 'El paciente fue notificado y verá el pago adicional en su panel.',
          icon: 'success',
          confirmButtonColor: '#B71C1C'
        }).then(() => {
          // Regresar al detalle de la cita
          this.router.navigate(['/medico/citas/detalle', this.citaId]);
        });
      },
      error: (error) => {
        this.saving = false;
        Swal.fire({
          title: 'Error',
          text: error?.error?.message || 'No se pudo agregar el cargo adicional',
          icon: 'error',
          confirmButtonColor: '#B71C1C'
        });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/medico/citas/detalle', this.citaId]);
  }
}
