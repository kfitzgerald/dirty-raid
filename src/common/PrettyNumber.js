import React from 'react';
import propTypes from "prop-types";

export function PrettyNumberFormatter(nStr) {
    nStr += '';
    let x = nStr.split('.');
    let x1 = x[0];
    let x2 = x.length > 1 ? '.' + x[1] : '';
    const rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, "$1,$2");
    }
    return x1 + x2;
}

export function NumberFormatter(val, decimals = 0) {
    return PrettyNumberFormatter(typeof val === "number" ? val.toFixed(decimals) : val);
}

export function CurrencyFormatter(val, decimals = 2) {
    return '$' + PrettyNumberFormatter(typeof val === "number" ? val.toFixed(decimals) : val);
}

export function PercentFormatter(val, decimals = 2) {
    // noinspection JSConstructorReturnsPrimitive
    return NumberFormatter(val * 100, decimals) + '%';
}

export function AccountingFormatter(value, decimals=0, prefix="", suffix="", fallback="–") {
    if (typeof value === "number") value = value.toFixed(decimals);
    if (!value) return fallback;

    const isNegative = value[0] === '-';
    if (isNegative) {
        prefix = '(' + prefix;
        suffix = suffix + ')';
        value = value.substring(1); // strip negative sign
    }

    return `${prefix}${NumberFormatter(value, decimals)}${suffix}`;
}

export function CondensedFormatter(val, decimals = 3, prefix = '') {
    if (Math.abs(val) >= 1000000000) {
        // noinspection JSConstructorReturnsPrimitive
        return prefix + StripTrailingZeros(NumberFormatter(val / 1000000000, decimals)) + 'B';
    } else if (Math.abs(val) >= 1000000) {
        // noinspection JSConstructorReturnsPrimitive
        return prefix + StripTrailingZeros(NumberFormatter(val / 1000000, decimals)) + 'M';
    } else if (Math.abs(val) >= 1000) {
        // noinspection JSConstructorReturnsPrimitive
        return prefix + StripTrailingZeros(NumberFormatter(val / 1000, decimals)) + 'K';
    } else {
        return StripTrailingZeros(NumberFormatter(val, decimals));
    }
}

export function StripTrailingZeros(val) {
    return val.replace(/^(.*\.[0-9]*?)[0]+$/, '$1').replace(/\.$/, '');
}

export default function PrettyNumber ({ value, className }) {
    if (typeof value === 'number' || typeof value === 'string') {
        return (
            <span className={className}>{PrettyNumberFormatter(value)}</span>
        );
    } else {
        return null;
    }
}

PrettyNumber.propTypes = {
    value: propTypes.oneOfType([ propTypes.number, propTypes.string ]),
    className: propTypes.string
};

PrettyNumber.Percent = function PrettyNumberPercent({ value, multiplier=100, decimals=2, ...props }) {
    if (typeof value === "number") value = (value*multiplier).toFixed(decimals);
    return (
        <><PrettyNumber value={value} {...props} />%</>
    );
};

PrettyNumber.Percent.propTypes = {
    ...PrettyNumber.propTypes,
    decimals: propTypes.number,
    multiplier: propTypes.number
};

PrettyNumber.Fixed = function PrettyNumberPercent({ value, decimals=2, ...props }) {
    if (typeof value === "number") value = value.toFixed(decimals);
    return (
        <PrettyNumber value={value} {...props} />
    );
};

PrettyNumber.Fixed.propTypes = {
    ...PrettyNumber.propTypes,
    decimals: propTypes.number,
};

PrettyNumber.Dollars = function PrettyNumberDollars({ value, decimals=0, ...props }) {
    if (typeof value === "number") value = value.toFixed(decimals);
    return (
        <>$<PrettyNumber value={value} {...props} /></>
    );
};

PrettyNumber.Dollars.propTypes = {
    ...PrettyNumber.propTypes,
    decimals: propTypes.number
};

PrettyNumber.Accounting = function PrettyNumberAccounting({ value, prefix="", suffix="", decimals=0, fallback="–", ...props }) {
    if (typeof value === "number") value = value.toFixed(decimals);
    if (!value) return fallback;

    const isNegative = value[0] === '-';
    if (isNegative) {
        prefix = '(' + prefix;
        suffix = suffix + ')';
        value = value.substring(1); // strip negative sign
    }

    return (
        <>{prefix}<PrettyNumber value={value} {...props} />{suffix}</>
    );

};

PrettyNumber.Accounting.propTypes = {
    ...PrettyNumber.propTypes,
    decimals: propTypes.number,
    prefix: propTypes.string,
    suffix: propTypes.string
};

PrettyNumber.PhoneNumber = function PhoneNumber({ value }) {
    if (!value) return null;

    const cleanNumber = value.replace(/[^0-9]/g, '');
    // Desired: +1-234-567-8901
    // Current: 12345678901
    const parts = [];

    // last 4
    parts.unshift(cleanNumber.substring(cleanNumber.length-4, cleanNumber.length));

    // first 3
    parts.unshift(cleanNumber.substring(cleanNumber.length-7, cleanNumber.length-4));

    // area
    parts.unshift(cleanNumber.substring(cleanNumber.length-10, cleanNumber.length-7));

    // country
    const country = cleanNumber.substring(0, cleanNumber.length-10);
    if (country) parts.unshift('+'+cleanNumber.substring(0, cleanNumber.length-10));

    return parts.join('-');
};

PrettyNumber.PhoneNumber.propTypes = {
    value: propTypes.string
};