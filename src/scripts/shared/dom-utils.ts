import { isBooleanString, isNumberString } from './validation';

export function isElement(node: unknown): node is HTMLElement {
  return node instanceof HTMLElement;
}

export function toggleClass(
  targetElement: HTMLElement,
  classes: Record<string, boolean> | string[] | string,
  force?: boolean
): boolean {
  if (!isElement(targetElement)) {
    return false;
  }

  const classArray = Array.isArray(classes) ? classes : [classes];
  classArray.forEach((oneClass: string | Record<string, boolean>) => {
    if (typeof oneClass === 'object') {
      for (const property in oneClass) {
        if (typeof oneClass[property] === 'boolean') {
          targetElement.classList.toggle(property, oneClass[property]);
        }
      }
    } else if (typeof oneClass === 'string') {
      if (force === undefined) {
        targetElement.classList.toggle(oneClass);
      } else {
        targetElement.classList.toggle(oneClass, force);
      }
    }
  });

  return false;
}

export function setStyles(targetElements: HTMLElement | HTMLElement[], styles: string | Record<string, string> = ''): void {
  const elements = Array.isArray(targetElements) ? targetElements : [targetElements];
  elements.forEach((element) => {
    if (styles instanceof Object) {
      for (const prop in styles) {
        (element.style as any)[prop] = styles[prop] ?? '';
      }
    } else {
      element.style.cssText = String(styles);
    }
  });
}

export function setValidated(targetElement: HTMLElement, result: boolean | null = null): void {
  const element = isElement(targetElement) ? targetElement : null;
  if (!element) {
    return;
  }
  const baseId = element.id;
  const fieldLabel = document.getElementById(`${baseId}-label`);
  const fieldPrefix = document.getElementById(`${baseId}-prefix`);
  const noteError = document.getElementById(`note-error-${baseId}`);
  const noteSuccess = document.getElementById(`note-success-${baseId}`);
  if (result === null) {
    toggleClass(element, { 'normal-input': true, 'error-input': false, 'success-input': false });
    if (isElement(fieldLabel)) toggleClass(fieldLabel, { 'normal-text': true, 'error-text': false, 'success-text': false });
    if (isElement(fieldPrefix)) toggleClass(fieldPrefix, { 'normal-prefix': true, 'error-prefix': false, 'success-prefix': false });
    if (isElement(noteError)) toggleClass(noteError, { hidden: true });
    if (isElement(noteSuccess)) toggleClass(noteSuccess, { hidden: true });
    element.setAttribute('data-validate', 'false');
    return;
  }

  toggleClass(element, { 'normal-input': !result, 'error-input': !result, 'success-input': result });
  if (isElement(fieldLabel)) toggleClass(fieldLabel, { 'normal-text': !result, 'error-text': !result, 'success-text': result });
  if (isElement(fieldPrefix)) toggleClass(fieldPrefix, { 'normal-prefix': !result, 'error-prefix': !result, 'success-prefix': result });
  if (isElement(noteError)) toggleClass(noteError, { hidden: result });
  if (isElement(noteSuccess)) toggleClass(noteSuccess, { hidden: !result });
  element.setAttribute('data-validate', String(result));
}

export function getCookie(name: string): string | null {
  const getCookiePath = (cookie: string): string => {
    const pathMatch = cookie.match(/(?:^|;\s*)path=([^;]*)/);
    return pathMatch?.[1] ?? '/';
  };

  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = (cookies[i] ?? '').trim();
    const keyValue = cookie.split('=');
    const cookieName = keyValue[0];
    const cookieValue = keyValue[1];

    if (cookieName === name) {
      const cookiePath = getCookiePath(cookie);
      const currentPath = window.location.pathname;
      return currentPath.startsWith(cookiePath) ? cookieValue || null : null;
    }
  }
  return null;
}

export function updateCookie(name: string, value: string, daysToExpire: number | null = null): void {
  const expirationDate = new Date();
  if (!daysToExpire) {
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  } else {
    expirationDate.setDate(expirationDate.getDate() + daysToExpire);
  }

  const secureAttribute = window.location.protocol === 'https:' ? 'Secure; ' : '';
  const cookieString = `${name}=${value}; expires=${expirationDate.toUTCString()}; path=${window.location.pathname}; ${secureAttribute}SameSite=Lax`;
  document.cookie = cookieString;
}

export function getAtts(targetElement: HTMLElement, attribute = ''): unknown {
  const atts = targetElement.getAttributeNames();
  if (atts.length === 0) {
    return undefined;
  }

  const normalizeValue = (value: string | null): unknown => {
    return isNumberString(value) ? Number(value) : isBooleanString(value) ? /^true$/i.test(value) : value;
  };

  if (attribute === '') {
    const obj: Record<string, unknown> = {};
    atts.forEach((item) => {
      obj[item] = normalizeValue(targetElement.getAttribute(item));
    });
    return obj;
  }

  if (atts.includes(attribute)) {
    return normalizeValue(targetElement.getAttribute(attribute));
  }

  return undefined;
}

export function mb_strwidth(str: string): number {
  let i = 0;
  const len = str.length;
  let length = 0;

  for (; i < len; i++) {
    const c = str.charCodeAt(i);
    if (0x0000 <= c && c <= 0x0019) {
      length += 0;
    } else if (0x0020 <= c && c <= 0x1fff) {
      length += 1;
    } else if (0x2000 <= c && c <= 0xff60) {
      length += 2;
    } else if (0xff61 <= c && c <= 0xff9f) {
      length += 1;
    } else if (0xffa0 <= c) {
      length += 2;
    }
  }
  return length;
}

export function mb_strimwidth(str: string, start: number, width: number, trimmarker = ''): string {
  const trimmarkerWidth = mb_strwidth(trimmarker);
  let i = start;
  const len = str.length;
  let trimmedLength = 0;
  let trimmedStr = '';

  for (; i < len; i++) {
    const c = str.charAt(i);
    const charWidth = mb_strwidth(c);
    const next = str.charAt(i + 1);
    const nextWidth = mb_strwidth(next);

    trimmedLength += charWidth;
    trimmedStr += c;

    if (trimmedLength + trimmarkerWidth + nextWidth > width) {
      trimmedStr += trimmarker;
      break;
    }
  }
  return trimmedStr;
}

export function watcher(
  targetElements: HTMLElement | HTMLElement[],
  callback: (mutation: MutationRecord) => void,
  config: MutationObserverInit = {},
  onInvalidTarget?: () => void
): void {
  const elements = Array.isArray(targetElements) ? targetElements : [targetElements];
  if (typeof callback !== 'function') {
    return;
  }

  const resolvedConfig: MutationObserverInit = Object.assign(
    {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
    },
    config
  );

  elements.forEach((element) => {
    if (!isElement(element)) {
      onInvalidTarget?.();
      return;
    }

    new MutationObserver((mutations: MutationRecord[]) => {
      mutations.forEach((mutation) => {
        callback(mutation);
      });
    }).observe(element, resolvedConfig);
  });
}
