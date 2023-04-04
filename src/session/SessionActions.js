import {apiGet, apiPost, CLIENT_ID} from "../common/API";

//region Validate Token

export const REQUEST_TOKEN_VALIDATE = 'REQUEST_TOKEN_VALIDATE';
export function requestTokenValidate() {
    return {
        type: REQUEST_TOKEN_VALIDATE
    };
}

export const RECEIVE_TOKEN_VALIDATE_SUCCESS = 'RECEIVE_TOKEN_VALIDATE_SUCCESS';
export function requestTokenValidateSuccess(data) {
    return {
        type: RECEIVE_TOKEN_VALIDATE_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_TOKEN_VALIDATE_ERROR = 'RECEIVE_TOKEN_VALIDATE_ERROR';
export function receiveTokenValidateError(error) {
    return {
        type: RECEIVE_TOKEN_VALIDATE_ERROR,
        error
    };
}

/**
 * Validates the current OAuth token to see if it's still ... valid!
 * @param callback
 * @return {(function(*, *): (undefined|*))|*}
 */
export function fetchTokenValidate(callback=() => {}) {
    return (dispatch, getState) => {
        const { session } = getState();
        if (session.isFetching) return; // no dup requests

        // Fetch access token
        const { access_token } = session.token;
        if (!session.token.access_token) {
            // no access token, fail fast
            return callback(false);
        }

        dispatch(requestTokenValidate());
        apiGet('https://id.twitch.tv/oauth2/validate', { oauth: access_token, clientId: null })
            .then(body => {
                dispatch(requestTokenValidateSuccess(body));
                callback(null, body);
            }, err => {
                dispatch(receiveTokenValidateError(err));
                callback(err);
            })
        ;
    };
}

//endregion

//region Set OAuth Token

// Sets the token when received
export const SET_OAUTH_TOKEN = 'SET_OAUTH_TOKEN';
export function setOAuthToken(data) {
    return {
        type: SET_OAUTH_TOKEN,
        lastUpdated: Date.now(),
        data
    };
}

//endregion

//region Revoke OAuth Token (logout)

// Clears the token from the app state
export const CLEAR_OAUTH_TOKEN = 'CLEAR_OAUTH_TOKEN';
export function clearOAuthToken() {
    return {
        type: CLEAR_OAUTH_TOKEN,
    };
}

/**
 * Instruct Twitch to revoke the access token
 * @param callback
 * @return {(function(*, *): void)|*}
 */
export function revokeToken(callback=() => {}) {
    return (dispatch, getState) => {
        const { session } = getState();
        const { access_token } = session.token || {};

        // Clear the token state
        dispatch(clearOAuthToken());

        if (!access_token) return // no access tokken, no request

        // Tell twitch to revoke the token
        apiPost('https://id.twitch.tv/oauth2/revoke', { payload: { client_id: CLIENT_ID, token: access_token }, json: false, clientId: null, bearer: null })
            .then(body => {
                callback(null, body);
            }, err => {
                callback(err);
            })
        ;
    };
}

//endregion

