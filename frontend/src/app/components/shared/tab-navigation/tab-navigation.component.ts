import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface Tab {
  id: string;
  label: string;
  route?: string;
  icon?: string;
  badge?: number;
  disabled?: boolean;
  active?: boolean;
}

@Component({
  selector: 'app-tab-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tab-navigation.component.html',
  styleUrls: ['./tab-navigation.component.css']
})
export class TabNavigationComponent implements AfterViewInit {
  @ViewChild('tabsContainer') tabsContainer!: ElementRef<HTMLDivElement>;
  
  @Input() tabs: Tab[] = [];
  @Input() activeTabId?: string;
  @Input() variant: 'default' | 'pills' | 'underline' = 'default';
  @Input() centered: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() scrollable: boolean = false;
  
  @Output() tabChange = new EventEmitter<string>();
  @Output() tabClick = new EventEmitter<Tab>();

  indicatorStyle: { left: string; width: string } = { left: '0', width: '0' };
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    // Inicializar el indicador después de que la vista esté lista
    setTimeout(() => {
      this.updateIndicator();
    }, 0);

    // Observar cambios de tamaño para actualizar el indicador
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateIndicator();
      });
      
      if (this.tabsContainer?.nativeElement) {
        this.resizeObserver.observe(this.tabsContainer.nativeElement);
      }
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  onTabClick(tab: Tab, event?: Event): void {
    if (tab.disabled) {
      event?.preventDefault();
      return;
    }

    if (!tab.route) {
      event?.preventDefault();
    }

    this.selectTab(tab.id);
    this.tabClick.emit(tab);
  }

  selectTab(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab && !tab.disabled && this.activeTabId !== tabId) {
      this.activeTabId = tabId;
      this.tabChange.emit(tabId);
      
      // Actualizar el indicador
      setTimeout(() => {
        this.updateIndicator();
      }, 0);
    }
  }

  isTabActive(tabId: string): boolean {
    return this.activeTabId === tabId || this.tabs.find(t => t.id === tabId)?.active === true;
  }

  getActiveTabIndex(): number {
    return this.tabs.findIndex(t => this.isTabActive(t.id));
  }

  private updateIndicator(): void {
    if (this.variant !== 'underline') return;
    
    const activeIndex = this.getActiveTabIndex();
    if (activeIndex === -1) {
      this.indicatorStyle = { left: '0', width: '0' };
      return;
    }

    const container = this.tabsContainer?.nativeElement;
    if (!container) return;

    const tabs = container.querySelectorAll('.tab-item');
    const activeTab = tabs[activeIndex] as HTMLElement;
    
    if (activeTab) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      
      const left = tabRect.left - containerRect.left;
      const width = tabRect.width;
      
      this.indicatorStyle = {
        left: `${left}px`,
        width: `${width}px`
      };
    }
  }

  scrollToActiveTab(): void {
    if (!this.scrollable) return;
    
    const activeIndex = this.getActiveTabIndex();
    if (activeIndex === -1) return;

    const container = this.tabsContainer?.nativeElement;
    if (!container) return;

    const tabs = container.querySelectorAll('.tab-item');
    const activeTab = tabs[activeIndex] as HTMLElement;
    
    if (activeTab) {
      activeTab.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'center' 
      });
    }
  }

  get tabsClasses(): string {
    const classes = ['tabs-container'];
    
    if (this.variant) classes.push(`tabs-${this.variant}`);
    if (this.centered) classes.push('tabs-centered');
    if (this.fullWidth) classes.push('tabs-full-width');
    if (this.scrollable) classes.push('tabs-scrollable');
    
    return classes.join(' ');
  }
}