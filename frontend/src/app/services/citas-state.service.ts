import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CitasStateService {
  private citaActualizadaSubject = new Subject<void>();
  
  citaActualizada$ = this.citaActualizadaSubject.asObservable();
  
  notificarCitaActualizada(): void {
    this.citaActualizadaSubject.next();
  }
}