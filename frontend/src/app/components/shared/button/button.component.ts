import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() icon?: string; // Material icon name
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() ariaLabel?: string;
  
  @Output() clicked = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }

  get buttonClasses(): string {
    const classes: string[] = ['btn'];

    // Variant classes
    switch (this.variant) {
      case 'primary':
        classes.push('btn-primary');
        break;
      case 'secondary':
        classes.push('btn-secondary');
        break;
      case 'ghost':
        classes.push('btn-ghost');
        break;
      case 'danger':
        classes.push('btn-danger');
        break;
    }

    // Size classes
    switch (this.size) {
      case 'sm':
        classes.push('btn-sm');
        break;
      case 'md':
        classes.push('btn-md');
        break;
      case 'lg':
        classes.push('btn-lg');
        break;
    }

    // Additional classes
    if (this.fullWidth) {
      classes.push('w-full');
    }

    if (this.loading) {
      classes.push('btn-loading');
    }

    return classes.join(' ');
  }
}