/**
/**
 * Ambient Media Player v2 - TypeScript Frontend Application
 * Ported from ambient.js with full type safety
 */
declare const Sortable: typeof import('sortablejs') | undefined;
declare const init: () => void;
declare function execDebug(): void;
/**
 * Finds whether the given variable is an object.
 */
declare function isObject(value: any): value is Record<string, any>;
/**
 * Finds whether the given variable is an element of HTML.
 */
declare function isElement(node: any): node is HTMLElement;
/**
 * Determines if the given variable is a numeric string.
 */
declare function isNumberString(numstr: any): numstr is string;
/**
 * Determines if the given variable is a boolean string.
 */
declare function isBooleanString(boolstr: any): boolstr is string;
/**
 * Given a string containing the path to a file or directory,
 * this function will return the trailing name component.
 */
declare function basename(path: string): string;
/**
 * Gets the extension from the given file path.
 */
declare function getExt(path: string): string;
/**
 * Return true if a number is in range, otherwise false.
 */
declare function inRange(num: any, min: number, max: number): boolean;
declare function inArray(contains: any | any[], targetArray: any[], at_least_one?: boolean): boolean;
declare function snakeToCapital(str: string): string;
declare function setValidated(targetElement: HTMLElement, result?: boolean | null): void;
/**
 * Get cookie with specified name.
 */
declare function getCookie(name: string): string | null;
/**
 * Update the value of the cookie with the specified name.
 */
declare function updateCookie(name: string, value: string, daysToExpire?: number | null): void;
/**
 * Retrieves a DOMRect object providing information about the size
 * of given an element and its position relative to the viewport.
 */
declare function getRect(targetElement: any, property?: string): any;
/**
 * Toggle classes on element.
 */
declare function toggleClass(targetElement: HTMLElement, classes: Record<string, boolean> | string[] | string, force?: boolean): boolean;
/**
 * Set styles on element.
 */
declare function setStyles(targetElements: HTMLElement | HTMLElement[], styles?: string | Record<string, string>): void;
/**
 * Get attributes from element.
 */
declare function getAtts(targetElement: HTMLElement, attribute?: string): any;
/**
 * Set or remove attributes on the specified element.
 */
declare function setAtts(targetElements: HTMLElement | HTMLElement[], attributes?: Record<string, string>, remove?: boolean): void;
/**
 * Returns the width of string, where halfwidth characters count as 1,
 * and fullwidth characters count as 2.
 */
declare function mb_strwidth(str: string): number;
/**
 * Truncates string to specified width.
 */
declare function mb_strimwidth(str: string, start: number, width: number, trimmarker?: string): string;
/**
 * Watches the specified element.
 * This function as a wrapper for MutationObserver.
 */
declare function watcher(targetElements: HTMLElement | HTMLElement[], callback: (mutation: MutationRecord) => void, config?: MutationObserverInit): void;
/**
 * Fetch data using the specified URL and method.
 * This function as a wrapper for Fetch API.
 */
declare function fetchData(url?: string, method?: string, data?: Record<string, any>, datatype?: string, timeout?: number): Promise<any>;
/**
 * Set the storage for saving user data on the client side to be used.
 */
declare function useStge(stge?: string): void;
/**
 * Store user data in client-side storage.
 */
declare function saveStge(key: string, data: any): boolean;
/**
 * Removes specific properties from user data stored in client-side storage.
 */
declare function removeStge(key?: string | null): boolean;
/**
 * Logger for frontend of Ambient Media Player.
 */
declare function logger(...args: any[]): any;
declare let noticeHideTimerGlobal: number | null;
declare let noticeCleanupTimerGlobal: number | null;
/**
 * Update notice/notification display.
 */
declare function updateNotice(notification: NotificationPayload): void;
//# sourceMappingURL=ambient.d.ts.map