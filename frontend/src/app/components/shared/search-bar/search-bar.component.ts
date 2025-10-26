import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Buscar...';
  @Input() debounceTime: number = 300; // milliseconds
  @Input() minLength: number = 0; // Minimum characters before search
  @Input() showClearButton: boolean = true;
  @Input() disabled: boolean = false;
  @Input() autofocus: boolean = false;
  
  @Output() search = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  searchValue: string = '';
  isFocused: boolean = false;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Setup debounced search
    this.searchSubject
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        if (searchTerm.length >= this.minLength || searchTerm.length === 0) {
          this.search.emit(searchTerm);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchValue = value;
    this.searchSubject.next(value);
  }

  onClear(): void {
    this.searchValue = '';
    this.searchSubject.next('');
    this.clear.emit();
  }

  onFocus(): void {
    this.isFocused = true;
    this.focus.emit();
  }

  onBlur(): void {
    this.isFocused = false;
    this.blur.emit();
  }

  get showClear(): boolean {
    return this.showClearButton && this.searchValue.length > 0;
  }
}