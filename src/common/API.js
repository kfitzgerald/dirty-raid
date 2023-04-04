function appendValue(search, key, value) {
    if (typeof value === "undefined") {
        // do nothing
    } else if (value === null) {
        search.append(key, '');
    } else {
        search.append(key, value);
    }
}

function encodeQuery(obj) {
    const search = new URLSearchParams();

    Object.keys(obj).forEach((key) => {
        const value = obj[key];
        if (Array.isArray(value)) {
            value.forEach(val => {
                appendValue(search, key, val);
            });
        } else {
            appendValue(search, key, value);
        }
    });

    return search.toString();
}

// Pull the twitch app client id from the environment config
export const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;

/**
 * Executes an API call
 * @param method
 * @param path
 * @param payload
 * @param query
 * @param oauth
 * @param bearer
 * @param clientId
 * @param json
 * @return {Promise<unknown>}
 */
export function doApiCall(method, path, { payload, query, oauth, bearer, clientId=CLIENT_ID, json=true} = {}) {

    // Build a fetch request using the given params and options
    const headers = new Headers({
        'Accept': 'application/json'    // we always want JSON
    });

    const fetchArgs = {
        method,
        credentials: 'same-origin',
        headers
    };

    // Encode the payload as json or form-encoded, cuz twitch is inconsistent
    if (payload) {
        if (json) {
            fetchArgs.body = JSON.stringify(payload);
            headers.append('Content-Type', 'application/json');
        } else {
            fetchArgs.body = (new URLSearchParams(payload)).toString();
            headers.append('Content-Type', 'application/x-www-form-urlencoded');
        }
    }

    // Encode query specially to handle array args nicely
    if (query) {
        path += `?${encodeQuery(query)}`;
    }

    // Add the OAuth authorization header
    if (oauth) {
        headers.append('Authorization', 'OAuth ' + oauth);
    }

    // Add the Bearer authorization header
    if (bearer) {
        headers.append('Authorization', 'Bearer ' + bearer);
    }

    // Add the Client-ID header
    if (clientId) {
        headers.append('Client-Id', clientId);
    }

    // Execute and handle the fetch request
    return new Promise((resolve, reject) => {
        fetch(path, fetchArgs)
            .then(res => {
                // Some API calls do not return JSON or a body at all - only JSON-decode when necessary
                const contentType = res.headers.get("Content-Type") || '';
                if (contentType.includes('json')) {
                    return res.json();
                } else {
                    // no content - mock a response
                    return {
                        status: res.status,
                        data: null
                    };
                }
            })
            .then(body => {
                // Check auth
                if (body.status === 401) {
                    // twitch oauth expired or is no longer valid
                    reject(body);
                } else {
                    if (body.error) {
                        reject(body);
                    } else {
                        resolve(body);
                    }
                }
            })
            .catch(err => {
                // If something failed (e.g. parsing json, request failed to send, etc)
                // Mock a response
                console.warn('API Error', err); // eslint-disable-line no-console
                reject({
                    status: 500,
                    error: 'Request Failed',
                    message: err.message || err.toString()
                });
            })
        ;
    });

}

/**
 * Execute a GET request
 * @param path
 * @param args
 * @return {Promise<*>}
 */
export function apiGet(path, args) {
    return doApiCall('GET', path, args);
}

/**
 * Execute a PUT request
 * @param path
 * @param args
 * @return {Promise<*>}
 */
export function apiPut(path, args) {
    return doApiCall('PUT', path, args);
}

/**
 * Execute a POST request
 * @param path
 * @param args
 * @return {Promise<*>}
 */
export function apiPost(path, args) {
    return doApiCall('POST', path, args);
}

/**
 * Execute a DELETE request
 * @param path
 * @param args
 * @return {Promise<*>}
 */
export function apiDelete(path, args) {
    return doApiCall('DELETE', path, args);
}