import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true
    }
  ]
})
export class FormInputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'time' = 'text';
  @Input() id?: string;
  @Input() name?: string;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() required: boolean = false;
  @Input() error?: string;
  @Input() hint?: string;
  @Input() icon?: string; // Material icon name
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() autocomplete?: string;
  @Input() maxlength?: number;
  @Input() minlength?: number;
  @Input() pattern?: string;
  
  @Output() inputChange = new EventEmitter<string>();
  @Output() inputBlur = new EventEmitter<FocusEvent>();
  @Output() inputFocus = new EventEmitter<FocusEvent>();

  value: string = '';
  focused: boolean = false;
  showPassword: boolean = false;

  // ControlValueAccessor implementation
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(value: string): void {
    this.value = value;
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }

  handleBlur(event: FocusEvent): void {
    this.focused = false;
    this.onTouched();
    this.inputBlur.emit(event);
  }

  handleFocus(event: FocusEvent): void {
    this.focused = true;
    this.inputFocus.emit(event);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get inputType(): string {
    if (this.type === 'password' && this.showPassword) {
      return 'text';
    }
    return this.type;
  }

  get hasError(): boolean {
    return !!this.error;
  }

  get inputClasses(): string {
    const classes: string[] = ['form-input-custom'];
    
    if (this.hasError) {
      classes.push('border-error focus:ring-error focus:border-error');
    }
    
    if (this.icon && this.iconPosition === 'left') {
      classes.push('pl-12');
    }
    
    if (this.icon && this.iconPosition === 'right') {
      classes.push('pr-12');
    }
    
    if (this.type === 'password') {
      classes.push('pr-12');
    }
    
    return classes.join(' ');
  }
}