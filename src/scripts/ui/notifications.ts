import type { NotificationObject } from '../types/ambient';

export interface NoticeControllerOptions {
  alertElement: HTMLElement | null;
  dismissButton: HTMLElement | null;
  messageElement: HTMLElement | null;
  logger?: (...args: unknown[]) => void;
}

export interface NoticeController {
  hideLegacyAlert(): void;
  update(notification: NotificationObject): void;
}

function setElementVisibility(element: HTMLElement, visible: boolean): void {
  element.classList.toggle('hidden', !visible);
  element.style.display = visible ? 'flex' : '';
  element.style.visibility = visible ? 'visible' : 'hidden';
  element.style.opacity = visible ? '1' : '0';
}

export function createNoticeController(options: NoticeControllerOptions): NoticeController {
  const { alertElement, dismissButton, messageElement, logger } = options;
  let hideTimer: number | null = null;
  let cleanupTimer: number | null = null;

  const clearTimers = (): void => {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (cleanupTimer !== null) {
      window.clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }
  };

  const hideNotice = (): void => {
    if (!alertElement) return;
    alertElement.classList.add('notice-toast--hidden', 'pointer-events-none');
    alertElement.classList.remove('notice-toast--visible');
    cleanupTimer = window.setTimeout(() => {
      alertElement.classList.add('hidden');
      alertElement.style.visibility = 'hidden';
      alertElement.style.opacity = '0';
      cleanupTimer = null;
    }, 280);
  };

  return {
    hideLegacyAlert(): void {
      if (!alertElement) return;
      alertElement.classList.add('opacity-0', 'hidden');
    },
    update(notification: NotificationObject): void {
      logger?.('Have notification:', notification);
      if (!alertElement || !dismissButton) {
        return;
      }

      const classes = {
        base: 'fixed top-2 right-2 w-full max-w-sm flex notice-toast notice-toast--hidden items-start gap-3 p-4 z-[10050] text-sm border rounded-lg shadow-xl ',
        info: 'text-blue-800 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-900',
        success: 'text-green-800 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-900',
        warning: 'text-yellow-800 border-yellow-300 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-900',
        error: 'text-red-800 border-red-300 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-900',
        btnbase: 'ml-auto -mr-1 -mt-1 rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8 ',
        btninfo: 'bg-blue-50 text-blue-500 focus:ring-blue-400 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-400 dark:hover:bg-blue-700',
        btnsuccess: 'bg-green-50 text-green-500 focus:ring-green-400 hover:bg-green-200 dark:bg-green-800 dark:text-green-400 dark:hover:bg-green-700',
        btnwarning: 'bg-yellow-50 text-yellow-500 focus:ring-yellow-400 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-700',
        btnerror: 'bg-red-50 text-red-500 focus:ring-red-400 hover:bg-red-200 dark:bg-red-800 dark:text-red-400 dark:hover:bg-red-700',
      };

      const classKey = notification.type as keyof typeof classes;
      const btnClassKey = `btn${notification.type}` as keyof typeof classes;

      alertElement.setAttribute('class', classes.base + classes[classKey]);
      dismissButton.setAttribute('class', classes.btnbase + classes[btnClassKey]);
      setElementVisibility(alertElement, true);
      alertElement.style.zIndex = '10050';
      alertElement.style.width = 'min(22rem, calc(100vw - 1rem))';

      if (messageElement) {
        messageElement.innerHTML = notification.message;
      }

      clearTimers();
      alertElement.classList.remove('hidden');
      alertElement.classList.add('notice-toast--hidden', 'pointer-events-none');
      alertElement.classList.remove('notice-toast--visible');

      window.requestAnimationFrame(() => {
        alertElement.classList.remove('notice-toast--hidden', 'pointer-events-none');
        alertElement.classList.add('notice-toast--visible');
      });

      const delay = Object.prototype.hasOwnProperty.call(notification, 'delay')
        ? Number(notification.delay)
        : 0;
      if (delay > 0) {
        hideTimer = window.setTimeout(() => {
          hideNotice();
          hideTimer = null;
        }, delay);
      }

      if (!dismissButton.dataset['ambientBound']) {
        dismissButton.dataset['ambientBound'] = 'true';
        dismissButton.addEventListener('click', (evt: Event) => {
          evt.preventDefault();
          clearTimers();
          hideNotice();
        });
      }
    },
  };
}
