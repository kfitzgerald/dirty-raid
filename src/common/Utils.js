

export function sliceIntoChunks(arr, chunkSize) {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        let chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
}

export function toLower(value) {
    return (typeof value === 'string') ? value.toLowerCase() : '';
}

export function normalizeId(value) {
    return (value === undefined || value === null) ? null : String(value);
}

export function normalizeLogin(value) {
    return toLower(value).trim();
}
