// ------------------------------------------------------------
// Standard Cordova exec
// ------------------------------------------------------------

export type ExecSuccess = (result?: any) => void;
export type ExecError = (error?: any) => void;

// ------------------------------------------------------------
// Event Types & Payloads
// ------------------------------------------------------------

export type InAppBrowserEventType =
    | "beforeload"
    | "loadstart"
    | "loadstop"
    | "loaderror"
    | "exit"
    | "hide"
    | "message"
    | "customscheme"
    | "download"
    | string;

interface InAppBrowserEventBase {
    type: InAppBrowserEventType;
    windowId: string;
}

export interface InAppBrowserMessageEvent extends InAppBrowserEventBase {
    data: unknown;
}

export interface InAppBrowserStateEvent extends InAppBrowserEventBase {
    url: string;
}

export interface InAppBrowserErrorEvent extends InAppBrowserStateEvent {
    code: number;
    message: string;
}

export type InAppBrowserEvent = InAppBrowserStateEvent | InAppBrowserErrorEvent | InAppBrowserMessageEvent;

// ------------------------------------------------------------
// Script and CSS injection types
// ------------------------------------------------------------

export interface ExecuteScriptDetails {
    code?: string;
    file?: string;
}

export interface InsertCSSDetails {
    code?: string;
    file?: string;
}

// ------------------------------------------------------------
// Per-instance IAB window class
// ------------------------------------------------------------

export class IABWindow {
    constructor(windowId: string);

    readonly windowId: string;
    closed: boolean;

    /** base app client only */
    appId: string;

    /** INTERNAL: handlers map */
    _handlers: Record<string, Array<(event: InAppBrowserEvent) => void>>;

    /** INTERNAL: dispose instance after exit */
    _dispose(): void;

    /** INTERNAL: dispatch event to local handlers */
    _dispatch(event: InAppBrowserEvent): void;

    // -------- Instance browser commands --------
    show(success?: ExecSuccess, fail?: ExecError): void;
    hide(success?: ExecSuccess, fail?: ExecError): void;
    close(success?: ExecSuccess, fail?: ExecError): void;

    loadAfterBeforeload(
        url: string,
        success?: ExecSuccess,
        fail?: ExecError
    ): void;

    executeScript(
        details: ExecuteScriptDetails,
        success?: ExecSuccess,
        fail?: ExecError
    ): void;

    insertCSS(
        details: InsertCSSDetails,
        success?: ExecSuccess,
        fail?: ExecError
    ): void;

    addEventListener<T = InAppBrowserEvent>(
        event: InAppBrowserEventType,
        callback: (event: T) => void
    ): void;

    removeEventListener<T = InAppBrowserEvent>(
        event: InAppBrowserEventType,
        callback?: (event: T) => void
    ): void;
}

export class IABWindowId {
    windowId: string;
}

// ------------------------------------------------------------
// Top-level Multi-instance API (static)
// ------------------------------------------------------------

export interface InAppBrowserMultiAPI {
    // -----------------------
    // Async open
    // -----------------------
    openAsync(
        url: string,
        target?: string,
        options?: string,
        asObject?: true
    ): Promise<IABWindow>;

    openAsync(
        url: string,
        target: string | undefined,
        options: string | undefined,
        asObject: false
    ): Promise<IABWindowId>;

    // -----------------------
    // Sync open
    // -----------------------
    open(
        url: string,
        target?: string,
        options?: string,
        success?: ExecSuccess,
        fail?: ExecError
    ): IABWindow;

    // -----------------------
    // Helpers
    // -----------------------
    getBrowserInstance(windowId: string): IABWindow | undefined;
    getBrowserInstances(): Record<string, IABWindow>;

    // -----------------------
    // Static browser commands
    // -----------------------
    show(windowId: string, success?: ExecSuccess, fail?: ExecError): void;
    hide(windowId: string, success?: ExecSuccess, fail?: ExecError): void;
    close(windowId: string, success?: ExecSuccess, fail?: ExecError): void;

    loadAfterBeforeload(
        windowId: string,
        url: string,
        success?: ExecSuccess,
        fail?: ExecError
    ): void;

    executeScript(
        windowId: string,
        details: ExecuteScriptDetails,
        success?: ExecSuccess,
        fail?: ExecError
    ): void;

    insertCSS(
        windowId: string,
        details: InsertCSSDetails,
        success?: ExecSuccess,
        fail?: ExecError
    ): void;

    addEventListener(
        windowId: string,
        event: InAppBrowserEventType,
        callback: (event: InAppBrowserEvent) => void
    ): void;

    removeEventListener(
        windowId: string,
        event: InAppBrowserEventType,
        callback?: (event: InAppBrowserEvent) => void
    ): void;

    IABWindow: typeof IABWindow;
}

// ========== Global Cordova Augmentation ==========

declare global {
    interface Cordova {
        InAppBrowserMulti: InAppBrowserMultiAPI;
    }

    var cordova: Cordova;
}

// ========== UMD export for module loaders ==========

declare const InAppBrowserMulti: InAppBrowserMultiAPI;
export default InAppBrowserMulti;