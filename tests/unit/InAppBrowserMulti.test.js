const exec = require('cordova/exec');
const InAppBrowserMulti = require('../../www/InAppBrowserMulti.js');
const { IABWindow } = InAppBrowserMulti;

const SERVICE = 'InAppBrowserMulti';

const actions = [
    { action: 'show' },
    { action: 'hide' },
    { action: 'close' },
    { action: 'addEventListener' },
    { action: 'removeEventListener' },
    { action: 'loadAfterBeforeload' },
    { action: 'executeScript' },
    { action: 'insertCSS' }
];

const successFn = jest.fn();
const failFn = jest.fn();

const observerCallback = exec.mock.mock.calls[0][0].success;

describe('InAppBrowserMulti Tests', () => {
    beforeEach(() => {
        exec.reset();
    });

    // open and openAsync tests
    describe('InAppBrowserMulti open functions tests', () => {
        test('should return an IABWindow instance when open', () => {
            const ref1 = InAppBrowserMulti.open('https://example.com', '_blank', 'toolbar=yes,location=yes,hidden=no', successFn, failFn);

            expect(ref1).toBeInstanceOf(IABWindow);
            expect(ref1.windowId).toBeDefined();

            const call1 = exec.lastCall();

            expect(call1.success).toEqual(successFn);
            expect(call1.fail).toEqual(failFn);
            expect(call1.service).toEqual(SERVICE);
            expect(call1.action).toEqual('open');
            expect(call1.args).toEqual(['https://example.com', '_blank', 'toolbar=yes,location=yes,hidden=no', ref1.windowId]);

            const uuidOriginal = crypto.randomUUID;
            crypto.randomUUID = undefined;
            jest.spyOn(Date, 'now').mockReturnValueOnce('12345');
            exec.mock.mockClear();
            const ref2 = InAppBrowserMulti.open('https://example.com');

            expect(ref2).toBeInstanceOf(IABWindow);
            expect(ref2.windowId).toBeDefined();

            const call2 = exec.lastCall();

            expect(call2.success).toBeUndefined();
            expect(call2.fail).toBeUndefined();
            expect(call2.service).toEqual(SERVICE);
            expect(call2.action).toEqual('open');
            expect(call2.args).toEqual(['https://example.com', '_blank', '', '12345']);

            crypto.randomUUID = uuidOriginal;
        });

        test('should resolves with IABWindow when open async', async () => {
            const successFn = ({ success }) => {
                success({ windowId: 'WIN123' });
            };
            exec.mock.mockImplementationOnce(successFn);

            const ref1 = await InAppBrowserMulti.openAsync('https://example.com', '_blank', 'toolbar=yes,location=yes,hidden=no');

            expect(ref1).toBeInstanceOf(IABWindow);
            expect(ref1.windowId).toBe('WIN123');

            const call1 = exec.lastCall();

            expect(call1.service).toEqual(SERVICE);
            expect(call1.action).toEqual('open');
            expect(call1.args).toEqual(['https://example.com', '_blank', 'toolbar=yes,location=yes,hidden=no']);

            exec.mock.mockClear();
            const successFn1 = ({ success }) => {
                success({ windowId: 'WIN456' });
            };
            exec.mock.mockImplementationOnce(successFn1);
            const ref2 = await InAppBrowserMulti.openAsync('https://example.com', undefined, undefined, false);

            expect(ref2).toBe('WIN456');

            const call2 = exec.lastCall();

            expect(call2.service).toEqual(SERVICE);
            expect(call2.action).toEqual('open');
            expect(call2.args).toEqual(['https://example.com', '_blank', '']);
        });
    });

    // IABWindow instance tests
    describe('IABWindow instance functions tests', () => {
        test.each([
            { action: 'show' },
            { action: 'hide' },
            { action: 'close' }
        ])('should call $action of IABWindow instance with windowId', (args) => {
            const ref = new IABWindow('ID1');
            ref[args.action](successFn, failFn);

            const call = exec.lastCall();

            expect(call.success).toEqual(successFn);
            expect(call.fail).toEqual(failFn);
            expect(call.service).toEqual(SERVICE);
            expect(call.action).toBe(args.action);
            expect(call.args[0]).toBe('ID1');
        });

        // Events
        // loadstart, loadstop, beforeload - { type: 'loadstart', url: 'https://a', windowId: 'WIN1' }
        // loaderror - { type: 'loaderror', code: '123', message: 'error', windowId: 'WIN1' }
        // message - { type: 'message', data: {Object}, windowId: 'WIN1' }
        // hide, exist - { type: 'hide', windowId: 'WIN1' }

        // loadstart, loadstop, beforeload, loaderror, message, hide, exist
        test('should register handlers for event and dispatch works', () => {
            const ref = new IABWindow('EVT');

            const handler = jest.fn();
            ref.addEventListener('loadstop', handler);

            ref._dispatch({ type: 'loadstop', url: 'https://a', windowId: 'EVT' });

            expect(handler).toHaveBeenCalledWith({
                type: 'loadstop',
                url: 'https://a',
                windowId: 'EVT'
            });
        });

        // loadstart, loadstop, beforeload, loaderror, message, hide, exist
        test('should unregister handlers for matching event', () => {
            const ref = new IABWindow('W');

            const cb1 = jest.fn();
            const cb2 = jest.fn();

            ref.addEventListener('loadstart', cb1);
            ref.addEventListener('loadstart', cb2);

            ref._dispatch({ type: 'loadstart' });
            expect(cb1).toHaveBeenCalled();
            expect(cb2).toHaveBeenCalled();
            cb1.mockClear();
            cb2.mockClear();

            ref.removeEventListener('loadstart', cb1);

            ref._dispatch({ type: 'loadstart' });
            expect(cb1).not.toHaveBeenCalled();
            expect(cb2).toHaveBeenCalled();
        });

        test('should dispose the IABInstance when exit event triggers', () => {
            const warnSpy = jest.spyOn(console, 'warn');
            const ref = new IABWindow('WIN1');
            expect(ref.closed).toBe(false);

            ref._dispatch({ type: 'exit' });

            expect(ref.windowId).toEqual('WIN1');

            expect(ref.closed).toBe(true);
            expect(ref._handlers).toEqual({});
            for (const val of actions) {
                ref[val.action]();
                expect(warnSpy).toHaveBeenCalledWith(
                    `[${SERVICE}] Ref is closed; call ignored.`
                );
                const call = exec.lastCall();
                expect(call).toBeUndefined();
                warnSpy.mockClear();
            }
        });

        test('should log warning and do not call exec when instance is closed', () => {
            const warnSpy = jest.spyOn(console, 'warn');
            const ref = new IABWindow('WIN1');
            const showFn = ref.show;

            ref.closed = true;

            ref._dispose();
            expect(ref.show).toBe(showFn);

            for (const val of actions) {
                ref[val.action]();
                expect(warnSpy).toHaveBeenCalledWith(
                    `[${SERVICE}] Ref is closed; call ignored.`
                );
                const call = exec.lastCall();
                expect(call).toBeUndefined();
                warnSpy.mockClear();
            }
        });

        test('should route events from observeEvents to correct instance', () => {
            const iab1 = new IABWindow('A1');
            const iab2 = new IABWindow('A2');

            const cb1 = jest.fn();
            const cb2 = jest.fn();

            iab1.addEventListener('loadstop', cb1);
            iab2.addEventListener('loadstop', cb2);

            // const observerCallback = exec.mock.mock.calls[0][0].success;
            observerCallback({ windowId: 'A1', type: 'loadstop', url: 'http://a' });
            observerCallback({ windowId: 'A2', type: 'loadstop', url: 'http://b' });

            expect(cb1).toHaveBeenCalledWith({ windowId: 'A1', type: 'loadstop', url: 'http://a' });
            expect(cb2).toHaveBeenCalledWith({ windowId: 'A2', type: 'loadstop', url: 'http://b' });

            cb1.mockClear();
            cb2.mockClear();
            observerCallback({ windowId: 'A3', type: 'loadstop', url: 'http://c' });
            expect(cb1).not.toHaveBeenCalled();
            expect(cb1).not.toHaveBeenCalled();
        });

        test('should call loadAfterBeforeload with correct parameters', () => {
            const ref = new IABWindow('PRELOAD');
            ref.loadAfterBeforeload('https://next', successFn, failFn);

            const call = exec.lastCall();
            expect(call.success).toEqual(successFn);
            expect(call.fail).toEqual(failFn);
            expect(call.action).toBe('loadAfterBeforeload');
            expect(call.args[0]).toBe('PRELOAD');
            expect(call.args[1]).toBe('https://next');
        });

        test('should call inject script code with correct parameters', () => {
            const ref = new IABWindow('SCRIPT');
            ref.executeScript({ code: 'console.log(123)' }, successFn, failFn);

            const call = exec.lastCall();
            expect(call.success).toEqual(successFn);
            expect(call.fail).toEqual(failFn);
            expect(call.action).toBe('injectScriptCode');
            expect(call.args[0]).toBe('SCRIPT');
            expect(call.args[1]).toBe('console.log(123)');
            expect(call.args[2]).toBeTruthy();
        });

        test('should call inject script file with correct parameters', () => {
            const ref = new IABWindow('SCRIPT');
            ref.executeScript({ file: 'myfile.js' });

            const call = exec.lastCall();
            expect(call.success).toBeUndefined();
            expect(call.fail).toBeUndefined();
            expect(call.action).toBe('injectScriptFile');
            expect(call.args[0]).toBe('SCRIPT');
            expect(call.args[1]).toBe('myfile.js');
            expect(call.args[2]).toBeFalsy();
        });

        test('should call inject style code with correct parameters', () => {
            const ref = new IABWindow('CSS');
            ref.insertCSS({ code: 'background: red;' }, successFn, failFn);

            const call = exec.lastCall();
            expect(call.success).toEqual(successFn);
            expect(call.fail).toEqual(failFn);
            expect(call.action).toBe('injectStyleCode');
            expect(call.args[0]).toBe('CSS');
            expect(call.args[1]).toBe('background: red;');
            expect(call.args[2]).toBeTruthy();
        });

        test('should call inject style file with correct parameters', () => {
            const ref = new IABWindow('CSS');
            ref.insertCSS({ file: 'myfile.css' });

            const call = exec.lastCall();
            expect(call.success).toBeUndefined();
            expect(call.fail).toBeUndefined();
            expect(call.action).toBe('injectStyleFile');
            expect(call.args[0]).toBe('CSS');
            expect(call.args[1]).toBe('myfile.css');
            expect(call.args[2]).toBeFalsy();
        });
    });

    // InAppBrowserMulti static
    describe('InAppBrowserMulti static functions tests', () => {
        test.each([
            { action: 'show' },
            { action: 'hide' },
            { action: 'close' }
        ])('should call static $action which forwards to the IAB instance', (args) => {
            const ref = new IABWindow('ABC');
            const actionSpy = jest.spyOn(ref, args.action);

            InAppBrowserMulti[args.action]('ABC', successFn, failFn);

            expect(actionSpy).toHaveBeenCalledWith(successFn, failFn);

            const call = exec.lastCall();

            expect(call.success).toEqual(successFn);
            expect(call.fail).toEqual(failFn);
            expect(call.service).toEqual(SERVICE);
            expect(call.action).toBe(args.action);
            expect(call.args[0]).toBe('ABC');
        });

        test.each([
            { action: 'addEventListener' },
            { action: 'removeEventListener' }
        ])('should call static $action which forwards to the IAB instance', (args) => {
            const ref = new IABWindow('ABC');
            const cb = () => {};
            const actionSpy = jest.spyOn(ref, args.action);

            InAppBrowserMulti[args.action]('ABC', 'loadstart', cb);

            expect(actionSpy).toHaveBeenCalledWith('loadstart', cb);
        });

        test.each([
            { action: 'executeScript', realAction: 'executeScriptCode', value: { code: 'codeJS' } },
            { action: 'insertCSS', realAction: 'insertCSSCode', value: { file: 'file.js' } },
            { action: 'executeScript', realAction: 'executeScriptFile', value: { code: 'codeCSS' } },
            { action: 'insertCSS', realAction: 'insertCSSFile', value: { code: 'file.css' } }
        ])('should call static $action which forwards to the IAB instance', (args) => {
            const ref = new IABWindow('ABC');
            const actionSpy = jest.spyOn(ref, args.action);

            InAppBrowserMulti[args.action]('ABC', args.value, successFn, failFn);

            expect(actionSpy).toHaveBeenCalledWith(args.value, successFn, failFn);
        });

        test('should call static loadAfterBeforeload which forwards to the IAB instance', () => {
            const ref = new IABWindow('ABC');
            const actionSpy = jest.spyOn(ref, 'loadAfterBeforeload');

            InAppBrowserMulti.loadAfterBeforeload('ABC', 'http://a', successFn, failFn);

            expect(actionSpy).toHaveBeenCalledWith('http://a', successFn, failFn);
        });

        test.each(actions)('should warns when missing windowId for static $action', (args) => {
            console.warn = jest.fn();
            InAppBrowserMulti[args.action](null);

            expect(console.warn).toHaveBeenCalledWith(
                `[${SERVICE}] No windowId; call ignored.`
            );
        });

        test.each(actions)('should warns when IAB is closed for static $action', (args) => {
            const ref = new IABWindow('WIN1');
            ref.closed = true;
            console.warn = jest.fn();
            InAppBrowserMulti[args.action]('WIN1');

            expect(console.warn).toHaveBeenCalledWith(
                `[${SERVICE}] Ref is closed; call ignored.`
            );
        });

        test('should receive 1 or all IAB instances', () => {
            const ref1 = new IABWindow('WIN1');
            const ref3 = new IABWindow('WIN3');
            const ref4 = new IABWindow('WIN4');

            expect(InAppBrowserMulti.getBrowserInstance('WIN1')).toBe(ref1);
            expect(InAppBrowserMulti.getBrowserInstance('WIN3')).toBe(ref3);
            expect(InAppBrowserMulti.getBrowserInstance('WIN4')).toBe(ref4);
            expect(InAppBrowserMulti.getBrowserInstance('WIN5')).toBeUndefined();

            expect(InAppBrowserMulti.getBrowserInstances().WIN1).toBe(ref1);
        });
    });
});
