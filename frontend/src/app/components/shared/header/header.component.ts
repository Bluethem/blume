import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

export interface MenuItem {
  label: string;
  route: string;
  active?: boolean;
}

export interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() menuItems: MenuItem[] = [
    { label: 'Home', route: '/dashboard' },
    { label: 'Appointments', route: '/dashboard/appointments' },
    { label: 'Messages', route: '/dashboard/messages' },
    { label: 'Profile', route: '/dashboard/profile' }
  ];
  
  @Input() userInfo?: UserInfo;
  @Input() notificationCount: number = 0;
  @Input() showBookButton: boolean = true;
  
  @Output() bookAppointmentClick = new EventEmitter<void>();
  @Output() notificationsClick = new EventEmitter<void>();
  @Output() profileClick = new EventEmitter<void>();
  @Output() menuToggle = new EventEmitter<boolean>();

  mobileMenuOpen = false;
  notificationsOpen = false;
  profileMenuOpen = false;

  constructor(private sanitizer: DomSanitizer) {}

  getAvatarStyle(): SafeStyle {
    if (this.userInfo?.avatar) {
      return this.sanitizer.sanitize(1, `url(${this.userInfo.avatar})`) || '';
    }
    return '';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.menuToggle.emit(this.mobileMenuOpen);
    
    // Cerrar otros menús
    if (this.mobileMenuOpen) {
      this.notificationsOpen = false;
      this.profileMenuOpen = false;
    }
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.profileMenuOpen = false;
    }
    this.notificationsClick.emit();
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
    if (this.profileMenuOpen) {
      this.notificationsOpen = false;
    }
  }

  onBookAppointment(): void {
    this.bookAppointmentClick.emit();
  }

  onProfileClick(): void {
    this.profileClick.emit();
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  // Cerrar menús al hacer click fuera
  closeMenus(): void {
    this.notificationsOpen = false;
    this.profileMenuOpen = false;
  }

  get hasNotifications(): boolean {
    return this.notificationCount > 0;
  }

  get notificationBadge(): string {
    if (this.notificationCount > 99) {
      return '99+';
    }
    return this.notificationCount.toString();
  }
}