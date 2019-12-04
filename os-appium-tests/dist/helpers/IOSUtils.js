"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const Context_1 = require("./Context");
function getNameSelector(name, type) {
    let convType = (type != undefined && type != "") ? type : "*";
    return '//' + convType + '[@name="' + name + '"]';
}
function getLabelSelector(label, type) {
    let convType = (type != undefined && type != "") ? type : "*";
    return '//' + convType + '[@label="' + label + '"]';
}
function getValueSelector(value, type) {
    let convType = (type != undefined && type != "") ? type : "*";
    return '//' + convType + '[@value="' + value + '"]';
}
function getElemByXPath(value, throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    return Context_1.waitForElement(value, throwError, waitTime);
}
exports.getElemByXPath = getElemByXPath;
function getElemByName(value, throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    return Context_1.waitForElement(getNameSelector(value), throwError, waitTime);
}
exports.getElemByName = getElemByName;
function getElemByLabel(value, throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    return Context_1.waitForElement(getLabelSelector(value), throwError, waitTime);
}
exports.getElemByLabel = getElemByLabel;
function getElemByValue(value, throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    return Context_1.waitForElement(getValueSelector(value), throwError, waitTime);
}
exports.getElemByValue = getElemByValue;
