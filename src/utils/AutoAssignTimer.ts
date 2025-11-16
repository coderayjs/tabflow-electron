/**
 * Professional utility class for managing auto-assign timers
 * Handles selection delay and countdown logic with proper cleanup
 */
export class AutoAssignTimer {
  private selectionTimer: NodeJS.Timeout | null = null;
  private countdownTimer: NodeJS.Timeout | null = null;
  private isSelected: boolean = false;
  private onAutoAssignCallback: () => void;
  private onStateChangeCallback?: (state: TimerState) => void;
  private selectionDelay: number;
  private countdownDuration: number;
  private currentCountdown: number;

  constructor(options: AutoAssignTimerOptions) {
    this.onAutoAssignCallback = options.onAutoAssign;
    this.onStateChangeCallback = options.onStateChange;
    this.selectionDelay = options.selectionDelay ?? 6000;
    this.countdownDuration = options.countdownDuration ?? 10;
    this.currentCountdown = this.countdownDuration;
  }

  /**
   * Start the selection timer
   * After the delay, if no selection was made, shows modal and starts countdown
   */
  start(): void {
    this.cancel();
    this.isSelected = false;
    this.currentCountdown = this.countdownDuration;
    this.notifyStateChange({ showModal: false, countdown: this.countdownDuration });

    this.selectionTimer = setTimeout(() => {
      if (!this.isSelected) {
        this.showModal();
        this.startCountdown();
      }
    }, this.selectionDelay);
  }

  /**
   * Mark that a selection has been made
   * This will cancel the timers
   */
  markAsSelected(): void {
    this.isSelected = true;
    this.cancel();
  }

  /**
   * Cancel all timers and reset state
   */
  cancel(): void {
    if (this.selectionTimer) {
      clearTimeout(this.selectionTimer);
      this.selectionTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.notifyStateChange({ showModal: false, countdown: this.countdownDuration });
  }

  /**
   * Immediately trigger auto-assign
   */
  assignNow(): void {
    this.cancel();
    this.onAutoAssignCallback();
  }

  /**
   * Show the modal and start countdown
   */
  private showModal(): void {
    this.currentCountdown = this.countdownDuration;
    this.notifyStateChange({ showModal: true, countdown: this.currentCountdown });
  }

  /**
   * Start the countdown timer
   */
  private startCountdown(): void {
    this.countdownTimer = setInterval(() => {
      this.currentCountdown -= 1;
      this.notifyStateChange({ showModal: true, countdown: this.currentCountdown });

      if (this.currentCountdown <= 0) {
        this.cancel();
        this.onAutoAssignCallback();
      }
    }, 1000);
  }

  /**
   * Notify state change to callback
   */
  private notifyStateChange(state: TimerState): void {
    this.onStateChangeCallback?.(state);
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    this.cancel();
  }
}

export interface AutoAssignTimerOptions {
  onAutoAssign: () => void;
  onStateChange?: (state: TimerState) => void;
  selectionDelay?: number; // Delay before showing modal (default: 6000ms)
  countdownDuration?: number; // Countdown duration (default: 10 seconds)
}

export interface TimerState {
  showModal: boolean;
  countdown: number;
}

