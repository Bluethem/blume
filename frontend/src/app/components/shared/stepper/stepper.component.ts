import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Step {
  label: string;
  description?: string;
  icon?: string;
  completed?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.css']
})
export class StepperComponent {
  @Input() steps: Step[] = [];
  @Input() currentStep: number = 0;
  @Input() linear: boolean = true; // Si true, no se puede saltar pasos
  @Input() showLabels: boolean = true;
  @Input() showDescriptions: boolean = false;
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  
  @Output() stepChange = new EventEmitter<number>();
  @Output() stepClick = new EventEmitter<number>();

  onStepClick(index: number): void {
    // Si es linear, solo permitir ir a pasos anteriores o al siguiente paso completado
    if (this.linear) {
      const previousStepsCompleted = this.steps
        .slice(0, index)
        .every(step => step.completed);
      
      if (index <= this.currentStep || previousStepsCompleted) {
        this.goToStep(index);
      }
    } else {
      // Si no es linear, permitir ir a cualquier paso no deshabilitado
      if (!this.steps[index]?.disabled) {
        this.goToStep(index);
      }
    }
    
    this.stepClick.emit(index);
  }

  goToStep(index: number): void {
    if (index >= 0 && index < this.steps.length && index !== this.currentStep) {
      this.currentStep = index;
      this.stepChange.emit(index);
    }
  }

  next(): void {
    if (this.canGoNext()) {
      this.goToStep(this.currentStep + 1);
    }
  }

  previous(): void {
    if (this.canGoPrevious()) {
      this.goToStep(this.currentStep - 1);
    }
  }

  canGoNext(): boolean {
    return this.currentStep < this.steps.length - 1;
  }

  canGoPrevious(): boolean {
    return this.currentStep > 0;
  }

  isStepCompleted(index: number): boolean {
    return this.steps[index]?.completed || false;
  }

  isStepActive(index: number): boolean {
    return this.currentStep === index;
  }

  isStepDisabled(index: number): boolean {
    if (this.steps[index]?.disabled) {
      return true;
    }
    
    if (this.linear && index > this.currentStep) {
      // En modo linear, deshabilitar pasos futuros si el anterior no está completado
      const previousStepsCompleted = this.steps
        .slice(0, index)
        .every(step => step.completed);
      return !previousStepsCompleted;
    }
    
    return false;
  }

  getStepState(index: number): 'completed' | 'active' | 'disabled' | 'pending' {
    if (this.isStepCompleted(index)) return 'completed';
    if (this.isStepActive(index)) return 'active';
    if (this.isStepDisabled(index)) return 'disabled';
    return 'pending';
  }

  get progressPercentage(): number {
    if (this.steps.length === 0) return 0;
    return ((this.currentStep + 1) / this.steps.length) * 100;
  }

  get completedStepsCount(): number {
    return this.steps.filter(step => step.completed).length;
  }
}