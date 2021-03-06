"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const camelCase = require("camelcase");
const mobx = require("mobx");
const validator = require("validator");
const { computed } = mobx;
var Types;
(function (Types) {
    Types["Ascii"] = "isAscii";
    Types["Base64"] = "isBase64";
    Types["Boolean"] = "isBoolean";
    Types["CreditCard"] = "isCreditCard";
    Types["Currency"] = "isCurrency";
    Types["DataURI"] = "isDataURI";
    Types["Decimal"] = "isDecimal";
    Types["Email"] = "isEmail";
    Types["Float"] = "isFloat";
    Types["HexColor"] = "isHexColor";
    Types["Hexadecimal"] = "isHexadecimal";
    Types["IP"] = "isIP";
    Types["Int"] = "isInt";
    Types["JSON"] = "isJSON";
    Types["MACAddress"] = "isMACAddress";
    Types["Numeric"] = "isNumeric";
    Types["URL"] = "isURL";
    Types["UUID"] = "isUUID";
})(Types = exports.Types || (exports.Types = {}));
/**
 * 判断是否为NULL或者underfined
 * @param v 要判断的参数
 */
function isNullOrUndefined(v) {
    return v === undefined || v === null || v === '';
}
class Method {
    /**
     * 是否必填
     * @param target 要检测的目标属性
     * @param value 标准值
     */
    static required(targetValue, value) {
        return isNullOrUndefined(targetValue) && value;
    }
    /**
     * 最大值
     * @param targetValue 要检测的目标属性
     * @param value 标准值
     */
    static max(targetValue, value) {
        return targetValue > value;
    }
    /**
     * 最小值
     * @param targetValue 要检测的目标属性
     * @param value 标准值
     */
    static min(targetValue, value) {
        return targetValue < value;
    }
    /**
     * 正则表达式
     * @param targetValue 要检测的目标属性
     * @param value 标准值
     */
    static pattern(targetValue, value) {
        return !isNullOrUndefined(targetValue) ? value && value.test && !value.test(targetValue) : false;
    }
    static lengths(targetValue, value) {
        if (Object.prototype.toString.call(value) === '[object Array]' && value.length === 2) {
            return !isNullOrUndefined(targetValue)
                && targetValue.length
                && (targetValue.length < value[0] || targetValue.length > value[1]);
        }
    }
    /**
     * 判断类型
     * @param targetValue 要检测的目标属性
     * @param value 类型
     */
    static type(targetValue, value) {
        if (!isNullOrUndefined(targetValue) && validator[value]) {
            return !validator[value](targetValue);
        }
    }
}
const Tips = {
    lengths: (target, value) => `${target}.length must in [${value[0]},${value[1]}] `,
    max: (target, value) => `${target} maxValue is ${value} `,
    min: (target, value) => `${target} minValue is ${value} `,
    pattern: (target, value) => `${target} must match ${value} `,
    required: (target, value) => `${target} is required`,
    type: (target, value) => `${target} is typeof ${value}`,
};
function defineComputedProperty(target, name, descriptor) {
    Object.defineProperty(target, name, descriptor);
    computed(target, name, descriptor);
}
function getValidateError() {
    return this.constructor.__validateFields.find((key) => this[key]);
}
exports.getValidateError = getValidateError;
function getIsValid() {
    return !this.validateError;
}
exports.getIsValid = getIsValid;
/**
 * @param reg 校验规则
 * @param msg 全局提示信息
 */
function default_1(rules) {
    const test = (target, targetValue, source) => valid(target, targetValue, source, rules);
    return (target, name, args) => {
        const validateName = camelCase('validateError', name);
        const descriptor = {
            configurable: true,
            enumerable: false,
            get: function getter() {
                return test(name, this[name], this);
            },
        };
        defineComputedProperty(target, validateName, descriptor);
        const clazz = target.constructor;
        if (clazz.hasOwnProperty('__validateFields')) {
            clazz.__validateFields.push(validateName);
        }
        else {
            Object.defineProperty(clazz, '__validateFields', {
                configurable: true,
                enumerable: false,
                value: [validateName],
            });
        }
        if (!target.hasOwnProperty('validateError')) {
            defineComputedProperty(target, 'validateError', {
                configurable: true,
                enumerable: false,
                get: getValidateError,
            });
        }
        if (!target.hasOwnProperty('isValid')) {
            defineComputedProperty(target, 'isValid', {
                configurable: true,
                enumerable: false,
                get: getIsValid,
            });
        }
    };
}
exports.default = default_1;
function valid(target, targetValue, source, rules) {
    for (const rule of rules) {
        const { message, custom, before, ...other } = rule;
        // custom 自定义校验器有值
        if (custom) {
            return custom(target, targetValue, source);
        }
        else {
            let value = before && before(targetValue);
            value = value || targetValue;
            for (const reg in other) {
                if (Method[reg](value, rule[reg])) {
                    return message || Tips[reg](target, rule[reg]) || `${target} has error`;
                }
            }
        }
    }
}
