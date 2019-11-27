import {DEFAULT_TIMEOUT, DEFAULT_TIMEOUT_INTERVAL} from "../constants"
import { waitForElement } from "./Context";

function getNameSelector (name: string, type?: string): string {
    let convType = (type != undefined && type != "") ? type : "*";
    return '//' + convType + '[@name="' + name + '"]';
}

function getLabelSelector (label: string, type?: string): string {
    let convType = (type != undefined && type != "") ? type : "*";
    return '//' + convType + '[@label="' + label + '"]';
}

function getValueSelector (value: string, type?: string): string {
    let convType = (type != undefined && type != "") ? type : "*";
    return '//' + convType + '[@value="' + value + '"]';
}

export function getElemByXPath (value: string, throwError: boolean = true, waitTime: number = DEFAULT_TIMEOUT): WebdriverIO.Element {
    return waitForElement(value, throwError, waitTime);
}

export function getElemByName (value: string, throwError: boolean = true, waitTime: number = DEFAULT_TIMEOUT): WebdriverIO.Element {
    return waitForElement(getNameSelector(value), throwError, waitTime);
}

export function getElemByLabel (value: string, throwError: boolean = true, waitTime: number = DEFAULT_TIMEOUT): WebdriverIO.Element {
    return waitForElement(getLabelSelector(value), throwError, waitTime);
}

export function getElemByValue (value: string, throwError: boolean = true, waitTime: number = DEFAULT_TIMEOUT): WebdriverIO.Element {
    return waitForElement(getValueSelector(value), throwError, waitTime);
}
