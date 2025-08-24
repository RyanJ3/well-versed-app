import {
  Directive,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnInit,
  OnDestroy,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
  EmbeddedViewRef,
  ChangeDetectorRef
} from '@angular/core';
import { Subject, fromEvent, animationFrameScheduler, BehaviorSubject } from 'rxjs';
import { takeUntil, throttleTime, distinctUntilChanged, debounceTime } from 'rxjs/operators';

export interface VirtualScrollViewport {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  startIndex: number;
  endIndex: number;
  visibleItems: any[];
  totalItems: number;
}

export interface VirtualScrollOptions {
  itemHeight?: number;          // Fixed height for each item
  bufferSize?: number;          // Number of items to render outside viewport
  scrollDebounce?: number;      // Debounce time for scroll events
  trackBy?: (index: number, item: any) => any;  // Track by function
  enableDynamicHeight?: boolean; // Support variable height items
  preloadImages?: boolean;      // Preload images in upcoming items
  recycleViews?: boolean;       // Recycle DOM nodes for better performance
}

@Directive({
  selector: '[appVirtualScroll]',
  standalone: true
})
export class VirtualScrollDirective implements OnInit, OnDestroy {
  @Input('appVirtualScroll') items: any[] = [];
  @Input() virtualScrollOptions: VirtualScrollOptions = {};
  @Input() virtualScrollTemplate!: TemplateRef<any>;
  @Input() virtualScrollContainerHeight = '100%';
  
  @Output() scrolled = new EventEmitter<VirtualScrollViewport>();
  @Output() scrolledToEnd = new EventEmitter<void>();
  @Output() scrolledToStart = new EventEmitter<void>();
  
  private destroy$ = new Subject<void>();
  private viewport$ = new BehaviorSubject<VirtualScrollViewport>({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    startIndex: 0,
    endIndex: 0,
    visibleItems: [],
    totalItems: 0
  });
  
  // Configuration with defaults
  private itemHeight = 100;
  private bufferSize = 5;
  private scrollDebounce = 10;
  private enableDynamicHeight = false;
  private recycleViews = true;
  
  // DOM elements
  private scrollContainer!: HTMLElement;
  private contentContainer!: HTMLElement;
  private spacerTop!: HTMLElement;
  private spacerBottom!: HTMLElement;
  
  // View management
  private viewPool: EmbeddedViewRef<any>[] = [];
  private activeViews = new Map<number, EmbeddedViewRef<any>>();
  private itemHeights = new Map<number, number>();
  private averageItemHeight = 100;
  
  // Performance tracking
  private lastScrollTop = 0;
  private scrollDirection: 'up' | 'down' = 'down';
  private isScrolling = false;
  private scrollTimeout?: number;
  
  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private viewContainer: ViewContainerRef,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.initializeOptions();
    this.createScrollStructure();
    this.setupScrollListener();
    this.initializeViewport();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearViews();
  }
  
  /**
   * Initialize options from input
   */
  private initializeOptions(): void {
    const options = this.virtualScrollOptions;
    
    this.itemHeight = options.itemHeight || 100;
    this.bufferSize = options.bufferSize || 5;
    this.scrollDebounce = options.scrollDebounce || 10;
    this.enableDynamicHeight = options.enableDynamicHeight || false;
    this.recycleViews = options.recycleViews !== false;
  }
  
  /**
   * Create the scroll container structure
   */
  private createScrollStructure(): void {
    const hostElement = this.elementRef.nativeElement;
    
    // Create scroll container
    this.scrollContainer = this.renderer.createElement('div');
    this.renderer.addClass(this.scrollContainer, 'virtual-scroll-container');
    this.renderer.setStyle(this.scrollContainer, 'height', this.virtualScrollContainerHeight);
    this.renderer.setStyle(this.scrollContainer, 'overflow-y', 'auto');
    this.renderer.setStyle(this.scrollContainer, 'position', 'relative');
    
    // Create content container
    this.contentContainer = this.renderer.createElement('div');
    this.renderer.addClass(this.contentContainer, 'virtual-scroll-content');
    this.renderer.setStyle(this.contentContainer, 'position', 'relative');
    
    // Create spacers for maintaining scroll height
    this.spacerTop = this.renderer.createElement('div');
    this.renderer.addClass(this.spacerTop, 'virtual-scroll-spacer-top');
    this.renderer.setStyle(this.spacerTop, 'height', '0px');
    
    this.spacerBottom = this.renderer.createElement('div');
    this.renderer.addClass(this.spacerBottom, 'virtual-scroll-spacer-bottom');
    this.renderer.setStyle(this.spacerBottom, 'height', '0px');
    
    // Assemble structure
    this.renderer.appendChild(this.contentContainer, this.spacerTop);
    this.renderer.appendChild(this.scrollContainer, this.contentContainer);
    this.renderer.appendChild(this.contentContainer, this.spacerBottom);
    this.renderer.appendChild(hostElement, this.scrollContainer);
  }
  
  /**
   * Setup scroll event listener with optimization
   */
  private setupScrollListener(): void {
    fromEvent(this.scrollContainer, 'scroll')
      .pipe(
        takeUntil(this.destroy$),
        throttleTime(this.scrollDebounce, animationFrameScheduler, {
          leading: true,
          trailing: true
        }),
        distinctUntilChanged((prev: any, curr: any) => {
          return Math.abs(prev.target.scrollTop - curr.target.scrollTop) < 5;
        })
      )
      .subscribe((event: any) => {
        this.handleScroll(event.target.scrollTop);
      });
    
    // Handle window resize
    fromEvent(window, 'resize')
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(200)
      )
      .subscribe(() => {
        this.handleResize();
      });
  }
  
  /**
   * Initialize viewport with initial items
   */
  private initializeViewport(): void {
    this.updateViewport(0);
    this.render();
  }
  
  /**
   * Handle scroll event
   */
  private handleScroll(scrollTop: number): void {
    // Determine scroll direction
    this.scrollDirection = scrollTop > this.lastScrollTop ? 'down' : 'up';
    this.lastScrollTop = scrollTop;
    
    // Set scrolling state
    this.isScrolling = true;
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = window.setTimeout(() => {
      this.isScrolling = false;
    }, 150);
    
    // Update viewport
    this.updateViewport(scrollTop);
    
    // Render visible items
    this.render();
    
    // Emit events
    const viewport = this.viewport$.value;
    this.scrolled.emit(viewport);
    
    // Check if scrolled to edges
    if (scrollTop === 0) {
      this.scrolledToStart.emit();
    } else if (scrollTop + viewport.clientHeight >= viewport.scrollHeight - 10) {
      this.scrolledToEnd.emit();
    }
  }
  
  /**
   * Update viewport calculations
   */
  private updateViewport(scrollTop: number): void {
    const containerHeight = this.scrollContainer.clientHeight;
    const totalHeight = this.getTotalHeight();
    
    // Calculate visible range
    const startIndex = this.getStartIndex(scrollTop);
    const endIndex = this.getEndIndex(scrollTop, containerHeight, startIndex);
    
    // Add buffer
    const bufferedStartIndex = Math.max(0, startIndex - this.bufferSize);
    const bufferedEndIndex = Math.min(this.items.length - 1, endIndex + this.bufferSize);
    
    // Get visible items
    const visibleItems = this.items.slice(bufferedStartIndex, bufferedEndIndex + 1);
    
    // Update viewport state
    this.viewport$.next({
      scrollTop,
      scrollHeight: totalHeight,
      clientHeight: containerHeight,
      startIndex: bufferedStartIndex,
      endIndex: bufferedEndIndex,
      visibleItems,
      totalItems: this.items.length
    });
  }
  
  /**
   * Render visible items
   */
  private render(): void {
    const viewport = this.viewport$.value;
    const { startIndex, endIndex, visibleItems } = viewport;
    
    // Update spacers
    this.updateSpacers(startIndex, endIndex);
    
    // Clear items outside viewport
    this.clearInvisibleViews(startIndex, endIndex);
    
    // Render visible items
    visibleItems.forEach((item, localIndex) => {
      const globalIndex = startIndex + localIndex;
      this.renderItem(item, globalIndex);
    });
    
    // Trigger change detection
    this.cdr.markForCheck();
  }
  
  /**
   * Render individual item
   */
  private renderItem(item: any, index: number): void {
    // Check if view already exists
    if (this.activeViews.has(index)) {
      // Update existing view if needed
      const view = this.activeViews.get(index)!;
      view.context.$implicit = item;
      view.context.index = index;
      return;
    }
    
    // Get or create view
    const view = this.recycleViews ? this.getRecycledView() : this.createView();
    
    // Set context
    view.context.$implicit = item;
    view.context.index = index;
    view.context.first = index === 0;
    view.context.last = index === this.items.length - 1;
    view.context.even = index % 2 === 0;
    view.context.odd = index % 2 !== 0;
    
    // Position the view
    const top = this.getItemOffset(index);
    const viewElement = view.rootNodes[0] as HTMLElement;
    this.renderer.setStyle(viewElement, 'position', 'absolute');
    this.renderer.setStyle(viewElement, 'top', `${top}px`);
    this.renderer.setStyle(viewElement, 'left', '0');
    this.renderer.setStyle(viewElement, 'right', '0');
    
    // Store active view
    this.activeViews.set(index, view);
    
    // Attach to DOM if not already
    if (!viewElement.parentNode) {
      this.renderer.appendChild(this.contentContainer, viewElement);
    }
    
    // Measure height if dynamic
    if (this.enableDynamicHeight) {
      requestAnimationFrame(() => {
        this.measureItemHeight(index, viewElement);
      });
    }
  }
  
  /**
   * Get or create a recycled view
   */
  private getRecycledView(): EmbeddedViewRef<any> {
    if (this.viewPool.length > 0) {
      return this.viewPool.pop()!;
    }
    return this.createView();
  }
  
  /**
   * Create a new view
   */
  private createView(): EmbeddedViewRef<any> {
    return this.viewContainer.createEmbeddedView(this.virtualScrollTemplate);
  }
  
  /**
   * Clear views outside viewport
   */
  private clearInvisibleViews(startIndex: number, endIndex: number): void {
    const viewsToRemove: number[] = [];
    
    this.activeViews.forEach((view, index) => {
      if (index < startIndex || index > endIndex) {
        viewsToRemove.push(index);
        
        if (this.recycleViews) {
          // Recycle the view
          this.viewPool.push(view);
          // Detach from DOM but don't destroy
          const element = view.rootNodes[0] as HTMLElement;
          if (element.parentNode) {
            this.renderer.removeChild(this.contentContainer, element);
          }
        } else {
          // Destroy the view
          view.destroy();
        }
      }
    });
    
    viewsToRemove.forEach(index => this.activeViews.delete(index));
  }
  
  /**
   * Clear all views
   */
  private clearViews(): void {
    this.activeViews.forEach(view => view.destroy());
    this.activeViews.clear();
    this.viewPool.forEach(view => view.destroy());
    this.viewPool = [];
  }
  
  /**
   * Update spacers to maintain scroll position
   */
  private updateSpacers(startIndex: number, endIndex: number): void {
    const topHeight = this.getItemOffset(startIndex);
    const bottomHeight = this.getTotalHeight() - this.getItemOffset(endIndex + 1);
    
    this.renderer.setStyle(this.spacerTop, 'height', `${topHeight}px`);
    this.renderer.setStyle(this.spacerBottom, 'height', `${Math.max(0, bottomHeight)}px`);
  }
  
  /**
   * Get total height of all items
   */
  private getTotalHeight(): number {
    if (!this.enableDynamicHeight) {
      return this.items.length * this.itemHeight;
    }
    
    // Calculate based on measured heights
    let totalHeight = 0;
    for (let i = 0; i < this.items.length; i++) {
      totalHeight += this.itemHeights.get(i) || this.averageItemHeight;
    }
    return totalHeight;
  }
  
  /**
   * Get offset for item at index
   */
  private getItemOffset(index: number): number {
    if (!this.enableDynamicHeight) {
      return index * this.itemHeight;
    }
    
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += this.itemHeights.get(i) || this.averageItemHeight;
    }
    return offset;
  }
  
  /**
   * Get start index for given scroll position
   */
  private getStartIndex(scrollTop: number): number {
    if (!this.enableDynamicHeight) {
      return Math.floor(scrollTop / this.itemHeight);
    }
    
    // Binary search for dynamic heights
    let accumulatedHeight = 0;
    for (let i = 0; i < this.items.length; i++) {
      const height = this.itemHeights.get(i) || this.averageItemHeight;
      if (accumulatedHeight + height > scrollTop) {
        return i;
      }
      accumulatedHeight += height;
    }
    return 0;
  }
  
  /**
   * Get end index for viewport
   */
  private getEndIndex(scrollTop: number, containerHeight: number, startIndex: number): number {
    const viewportBottom = scrollTop + containerHeight;
    
    if (!this.enableDynamicHeight) {
      return Math.min(
        Math.ceil(viewportBottom / this.itemHeight),
        this.items.length - 1
      );
    }
    
    // Calculate for dynamic heights
    let accumulatedHeight = this.getItemOffset(startIndex);
    for (let i = startIndex; i < this.items.length; i++) {
      if (accumulatedHeight > viewportBottom) {
        return i;
      }
      accumulatedHeight += this.itemHeights.get(i) || this.averageItemHeight;
    }
    return this.items.length - 1;
  }
  
  /**
   * Measure item height for dynamic sizing
   */
  private measureItemHeight(index: number, element: HTMLElement): void {
    const height = element.getBoundingClientRect().height;
    const previousHeight = this.itemHeights.get(index);
    
    if (height && height !== previousHeight) {
      this.itemHeights.set(index, height);
      this.updateAverageHeight();
      
      // Re-render if height changed significantly
      if (previousHeight && Math.abs(height - previousHeight) > 5) {
        this.render();
      }
    }
  }
  
  /**
   * Update average item height
   */
  private updateAverageHeight(): void {
    if (this.itemHeights.size === 0) return;
    
    let totalHeight = 0;
    this.itemHeights.forEach(height => totalHeight += height);
    this.averageItemHeight = totalHeight / this.itemHeights.size;
  }
  
  /**
   * Handle container resize
   */
  private handleResize(): void {
    this.updateViewport(this.lastScrollTop);
    this.render();
  }
  
  /**
   * Public API methods
   */
  
  /**
   * Scroll to index
   */
  scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth'): void {
    const offset = this.getItemOffset(index);
    this.scrollContainer.scrollTo({
      top: offset,
      behavior
    });
  }
  
  /**
   * Scroll to top
   */
  scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
    this.scrollContainer.scrollTo({
      top: 0,
      behavior
    });
  }
  
  /**
   * Scroll to bottom
   */
  scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
    this.scrollContainer.scrollTo({
      top: this.getTotalHeight(),
      behavior
    });
  }
  
  /**
   * Refresh the virtual scroll
   */
  refresh(): void {
    this.clearViews();
    this.updateViewport(this.lastScrollTop);
    this.render();
  }
  
  /**
   * Update items
   */
  updateItems(items: any[]): void {
    this.items = items;
    this.refresh();
  }
}