// tslint:disable:object-literal-sort-keys
let SCREEN_SIZE;
/**
 * The values in the below object are percentages of the screen
 */
const SWIPE_DIRECTION = {
    down: {
        start: {x: 50, y: 15},
        end: {x: 50, y: 85},
    },
    left: {
        start: {x: 95, y: 50},
        end: {x: 5, y: 50},
    },
    right: {
        start: {x: 5, y: 50},
        end: {x: 95, y: 50},
    },
    up: {
        start: {x: 50, y: 85},
        end: {x: 50, y: 15},
    },
};

const PINCH = {
    zoomOut: {
        finger1: {
            start: {x: 5, y: 50},
            end: {x: 45, y: 50}
        },
        finger2: {
            start: {x: 95, y: 50},
            end: {x: 55, y: 50}
        }
    },
    zoomIn: {
        finger1: {
            start: {x: 45, y: 50},
            end: {x: 5, y: 50}
        },
        finger2: {
            start: {x: 55, y: 50},
            end: {x: 95, y: 50}
        }
    }
};

class Gestures {

    /**
     * Check if an element is visible and if not scroll down a portion of the screen to
     * check if it visible after a x amount of scrolls
     *
     * @param {element} element
     * @param {number} maxScrolls
     * @param {number} amount
     */
    public static checkIfDisplayedWithScrollDown (element, maxScrolls, amount = 0, driver): void {
        if ((!element.isExisting() || !element.isDisplayed()) && amount <= maxScrolls) {
            this.swipeUp(0.85, driver);
            this.checkIfDisplayedWithScrollDown(element, maxScrolls, amount + 1, driver);
        } else if (amount > maxScrolls) {
            throw new Error(`The element '${element}' could not be found or is not visible.`);
        }
    }

    /**
     * Swipe down based on a percentage
     *
     * @param {number} percentage from 0 - 1
     */
    public static swipeDown (percentage = 1, driver): void {
        this.swipeOnPercentage(
            this._calculateXY(SWIPE_DIRECTION.down.start, percentage),
            this._calculateXY(SWIPE_DIRECTION.down.end, percentage),
            driver
        );
    }

    /**
     * Swipe Up based on a percentage
     *
     * @param {number} percentage from 0 - 1
     */
    public static swipeUp (percentage = 1, driver): void {
        this.swipeOnPercentage(
            this._calculateXY(SWIPE_DIRECTION.up.start, percentage),
            this._calculateXY(SWIPE_DIRECTION.up.end, percentage),
            driver
        );
    }

    /**
     * Swipe left based on a percentage
     *
     * @param {number} percentage from 0 - 1
     */
    public static swipeLeft (percentage = 1, driver): void {
        this.swipeOnPercentage(
            this._calculateXY(SWIPE_DIRECTION.left.start, percentage),
            this._calculateXY(SWIPE_DIRECTION.left.end, percentage),
            driver
        );
    }

    /**
     * Swipe right based on a percentage
     *
     * @param {number} percentage from 0 - 1
     */
    public static swipeRight (percentage = 1, driver): void {
        this.swipeOnPercentage(
            this._calculateXY(SWIPE_DIRECTION.right.start, percentage),
            this._calculateXY(SWIPE_DIRECTION.right.end, percentage),
            driver
        );
    }

    /**
     * Swipe from coordinates (from) to the new coordinates (to). The given coordinates are
     * percentages of the screen.
     *
     * @param {object} from { x: 50, y: 50 }
     * @param {object} to { x: 25, y: 25 }
     *
     * @example
     * <pre>
     *   // This is a swipe to the left
     *   const from = { x: 50, y:50 }
     *   const to = { x: 25, y:50 }
     * </pre>
     */
    public static swipeOnPercentage (from, to, driver): void {
        SCREEN_SIZE = SCREEN_SIZE || driver.getWindowRect();
        const pressOptions = this._getPercentDeviceCoords(SCREEN_SIZE, from);
        const moveToScreenCoordinates = this._getPercentDeviceCoords(SCREEN_SIZE, to);
        this.swipe(
            pressOptions,
            moveToScreenCoordinates,
            driver
        );
    }

    /**
     * Swipe from coordinates (from) to the new coordinates (to). The given coordinates are in pixels.
     *
     * @param {object} from { x: 50, y: 50 }
     * @param {object} to { x: 25, y: 25 }
     *
     * @example
     * <pre>
     *   // This is a swipe to the left
     *   const from = { x: 50, y:50 }
     *   const to = { x: 25, y:50 }
     * </pre>
     */
    public static swipe (from, to, driver, pause: number = 1000): void {
        driver.touchPerform([{
            action: 'press',
            options: from,
        }, {
            action: 'wait',
            options: {ms: pause},
        }, {
            action: 'moveTo',
            options: to,
        }, {
            action: 'release',
        }]);
        driver.pause(pause);
    }

    public static twoFingerPress (touchDuration, driver): void {
        driver.multiTouchPerform([
                [
                    {action: 'press', options: this._getPercentDeviceCoords(SCREEN_SIZE, {x: 45, y: 50})},
                    {action: 'wait', options: {ms: touchDuration}},
                    {action: 'release'}],
                [
                    {action: 'press', options: this._getPercentDeviceCoords(SCREEN_SIZE, {x: 55, y: 50})},
                    {action: 'wait', options: {ms: touchDuration}},
                    {action: 'release'}
                ]
            ]
        );
    }

    public static pinchZoomIn (driver, pause: number = 1000): void {
        SCREEN_SIZE = SCREEN_SIZE || driver.getWindowRect();
        driver.multiTouchPerform([
                [
                    {action: 'press', options: this._getPercentDeviceCoords(SCREEN_SIZE, PINCH.zoomIn.finger1.start)},
                    {action: 'moveTo', options: this._getPercentDeviceCoords(SCREEN_SIZE, PINCH.zoomIn.finger1.end)},
                    {action: 'release'}],
                [
                    {action: 'press', options: this._getPercentDeviceCoords(SCREEN_SIZE, PINCH.zoomIn.finger2.start)},
                    {action: 'moveTo', options: this._getPercentDeviceCoords(SCREEN_SIZE, PINCH.zoomIn.finger2.end)},
                    {action: 'release'}
                ]
            ]
        );
        driver.pause(pause);
    }

    public static pinchZoomOut (driver, pause: number = 1000): void {
        driver.multiTouchPerform([
                [
                    {action: 'press', options: this._getPercentDeviceCoords(SCREEN_SIZE, PINCH.zoomOut.finger1.start)},
                    {action: 'moveTo', options: this._getPercentDeviceCoords(SCREEN_SIZE, PINCH.zoomOut.finger1.end)},
                    {action: 'release'}],
                [
                    {action: 'press', options: this._getPercentDeviceCoords(SCREEN_SIZE, PINCH.zoomOut.finger2.start)},
                    {action: 'moveTo', options: this._getPercentDeviceCoords(SCREEN_SIZE, PINCH.zoomOut.finger2.end)},
                    {action: 'release'}
                ]
            ]
        );
        driver.pause(pause);
    }

    /**
     * Get the screen coordinates in percentage based on a device screensize
     *
     * @param {number} screenSize the size of the screen
     * @param {object} coordinates like { x: 50, y: 50 }
     *
     * @return {{x: number, y: number}}
     *
     * @private
     */
    public static _getPercentDeviceCoords (screenSize, coordinates): { x: number, y: number } {
        return {
            x: Math.round(screenSize.width * (coordinates.x / 100)),
            y: Math.round(screenSize.height * (coordinates.y / 100)),
        };
    }

    /**
     * Calculate the x y coordinates based on a percentage
     *
     * @param {object} coordinates
     * @param {number} percentage
     *
     * @return {{x: number, y: number}}
     *
     * @private
     */
    public static _calculateXY ({x, y}, percentage): { x: number, y: number } {
        return {
            x: x * percentage,
            y: y * percentage,
        };
    }
}

export default Gestures;
