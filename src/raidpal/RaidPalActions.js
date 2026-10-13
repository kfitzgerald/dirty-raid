import {apiGet} from "../common/API";
import {
    revokeToken
} from "../session/SessionActions";

//region RaidPal User

export const REQUEST_RAIDPAL_USER = 'REQUEST_RAIDPAL_USER';
export function requestRaidPalUser() {
    return {
        type: REQUEST_RAIDPAL_USER
    };
}

export const RECEIVE_RAIDPAL_USER_SUCCESS = 'RECEIVE_RAIDPAL_USER_SUCCESS';
export function requestRaidPalUserSuccess(data) {
    return {
        type: RECEIVE_RAIDPAL_USER_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_RAIDPAL_USER_ERROR = 'RECEIVE_RAIDPAL_USER_ERROR';
export function receiveRaidPalUserError(error) {
    return {
        type: RECEIVE_RAIDPAL_USER_ERROR,
        error
    };
}

export function fetchRaidPalUser(callback=() => {}) {
    return async (dispatch, getState) => {
        const { raidpal, session } = getState();
        if (raidpal.isFetching) return; // no dup requests
        if (!session.data) return; // no auth, no request

        const { login } = session.data;
        dispatch(requestRaidPalUser());
        apiGet(`https://api.raidpal.com/rest/user/${login}`, { clientId: null })
            .then(body => {
                if (body?.user) {
                    dispatch(requestRaidPalUserSuccess(body.user));
                    callback(null, body.user);
                } else {
                    const err = {
                        status: 404,
                        error_description: <>Not on RaidPal? <a href="https://raidpal.com/" target="_blank" rel="noreferrer">Register now!</a></>
                    };
                    dispatch(receiveRaidPalUserError(err));
                    callback(err);
                }
            }, err => {
                dispatch(receiveRaidPalUserError(err));
                callback(err);
            })
        ;
    };
}

//endregion

//region RaidPal Event

export const REQUEST_RAIDPAL_EVENT = 'REQUEST_RAIDPAL_EVENT';
export function requestRaidPalEvent() {
    return {
        type: REQUEST_RAIDPAL_EVENT
    };
}

export const RECEIVE_RAIDPAL_EVENT_SUCCESS = 'RECEIVE_RAIDPAL_EVENT_SUCCESS';
export function requestRaidPalEventSuccess(data) {
    return {
        type: RECEIVE_RAIDPAL_EVENT_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_RAIDPAL_EVENT_ERROR = 'RECEIVE_RAIDPAL_EVENT_ERROR';
export function receiveRaidPalEventError(error) {
    return {
        type: RECEIVE_RAIDPAL_EVENT_ERROR,
        error
    };
}

export function getSlug(event_uri) {
    const parts = event_uri.split('/');
    return parts[parts.length-1];
}

//region Custom Events (shared helpers + actions)

export function getCustomEventKey(data) {
    const e = data?.event || data;
    if (!e) return null;
    if (e.raidpal_link) return `rp:${getSlug(e.raidpal_link)}`;
    const title = (e.title || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const start = (e.starttime || '').toString().trim();
    return `ce:${title}-${start}`;
}

export const ADD_CUSTOM_EVENT = 'ADD_CUSTOM_EVENT';
export const REMOVE_CUSTOM_EVENT = 'REMOVE_CUSTOM_EVENT';
export const SELECT_CUSTOM_EVENT = 'SELECT_CUSTOM_EVENT';
export const CLEAR_ALL_CUSTOM_EVENTS = 'CLEAR_ALL_CUSTOM_EVENTS';

export function fetchRaidPalEvent(event_uri, callback=()=>{}) {
    return async (dispatch, getState) => {
        const { raidpal, session } = getState();
        if (raidpal.events.isFetching) return; // no dup requests
        if (!session.data) return; // no auth, no request

        dispatch(requestRaidPalEvent());
        apiGet(event_uri, { clientId: null })
            .then(body => {
                if (body?.event) {
                    dispatch(requestRaidPalEventSuccess(body.event));
                    callback(null, body.event);
                } else {
                    const err = {
                        status: 404,
                        error_description: 'Something went wrong trying to fetch the event'
                    };
                    dispatch(receiveRaidPalEventError(err));
                    callback(err);
                }
            }, err => {
                dispatch(receiveRaidPalEventError(err));
                callback(err);
            })
        ;
    };
}

//endregion

//region Twitch User Streams (not necessarily followers)

export const REQUEST_USER_STREAMS = 'REQUEST_USER_STREAMS';
export function requestUserStreams() {
    return {
        type: REQUEST_USER_STREAMS
    };
}

export const RECEIVE_USER_STREAMS_SUCCESS = 'RECEIVE_USER_STREAMS_SUCCESS';
export function requestUserStreamsSuccess(data) {
    return {
        type: RECEIVE_USER_STREAMS_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_USER_STREAMS_ERROR = 'RECEIVE_USER_STREAMS_ERROR';
export function receiveUserStreamsError(error) {
    return {
        type: RECEIVE_USER_STREAMS_ERROR,
        error
    };
}

/**
 * Fetch arbitrary user stream list
 * @param user_ids
 * @param callback
 * @return {(function(*, *): void)|*}
 */
export function fetchUserStreams(user_ids, callback=() => {}) {
    return async (dispatch, getState) => {
        // allow dup fetch for when user changes event before total fetch is complete since this is not a queued req
        const { /*raidpal,*/ session } = getState();
        // const { streams } = raidpal;
        // if (streams.isFetching) return; // no dup requests
        if (!session.data) return; // no auth, no request

        const { access_token } = session.token;

        dispatch(requestUserStreams());

        const queue = [].concat(user_ids);
        const pageSize = 100;
        let streamList = [];
        let ids, done = queue.length === 0, body, error, after, query;
        while (!done) { // ooo scary!

            // pull a batch of ids
            ids = queue.splice(0, 100);

            // Build query
            query = { user_id: ids, first: pageSize };
            if (after) query.after = after;

            // Execute request
            ({ error, body } = await apiGet('https://api.twitch.tv/helix/streams', { query, bearer: access_token})
                    .then(body => {
                        return { body, error: null };
                    }, error => {
                        return { error };
                    })
            );

            // If the request failed, handle it
            if (error) {
                // If twitch auth fails - it's likely due to an expired token
                // Clear the session!
                if (error.status === 401) {
                    dispatch(revokeToken());
                }

                dispatch(receiveUserStreamsError(error));
                callback(error);
                return
            } else {
                // Append the page to the results
                streamList = streamList.concat(body.data);

                // Check if there is another page to fetch
                after = body.pagination.cursor;
                done = !body.pagination.cursor;
            }
        }

        // success
        // dispatch(fetchUsers(streamList.map(s => s.user_id))); // fetch user info
        dispatch(requestUserStreamsSuccess(streamList));
        callback(null, streamList);

    };
}

//endregion

//region Custom Events

export const SET_CUSTOM_EVENT_DATA = 'SET_CUSTOM_EVENT_DATA';
export function setCustomEventData(data) {
    return {
        type: SET_CUSTOM_EVENT_DATA,
        lastUpdated: Date.now(),
        key: getCustomEventKey(data),
        data
    };
}

export function addCustomEvent(data) {
    return {
        type: ADD_CUSTOM_EVENT,
        lastUpdated: Date.now(),
        key: getCustomEventKey(data),
        data
    };
}

export function removeCustomEvent(key) {
    return {
        type: REMOVE_CUSTOM_EVENT,
        key
    };
}

export function selectCustomEvent(key) {
    return {
        type: SELECT_CUSTOM_EVENT,
        key
    };
}

export function clearAllCustomEvents() {
    return {
        type: CLEAR_ALL_CUSTOM_EVENTS
    };
}

//endregion


//endregion

//region Custom Streams

export const REQUEST_CUSTOM_STREAMS = 'REQUEST_CUSTOM_STREAMS';
export function requestCustomStreams() {
    return {
        type: REQUEST_CUSTOM_STREAMS
    };
}

export const RECEIVE_CUSTOM_STREAMS_SUCCESS = 'RECEIVE_CUSTOM_STREAMS_SUCCESS';
export function requestCustomStreamsSuccess(data) {
    return {
        type: RECEIVE_CUSTOM_STREAMS_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_CUSTOM_STREAMS_ERROR = 'RECEIVE_CUSTOM_STREAMS_ERROR';
export function receiveCustomStreamsError(error) {
    return {
        type: RECEIVE_CUSTOM_STREAMS_ERROR,
        error
    };
}

/**
 * Fetch arbitrary user stream list
 * @param user_logins
 * @param callback
 * @return {(function(*, *): void)|*}
 */
export function fetchCustomStreamsByLogin(user_logins, callback=() => {}) {
    return async (dispatch, getState) => {
        // allow dup fetch for when user changes event before total fetch is complete since this is not a queued req
        const { /*raidpal,*/ session } = getState();
        // const { streams } = raidpal;
        // if (streams.isFetching) return; // no dup requests
        if (!session.data) return; // no auth, no request

        const { access_token } = session.token;

        dispatch(requestCustomStreams());

        const queue = [].concat(user_logins);
        const pageSize = 100;
        let streamList = [];
        let logins, done = false, body, error, after, query;
        while (!done) { // ooo scary!

            // pull a batch of user_logins
            logins = queue.splice(0, 100);

            // Build query
            query = { user_login: logins, first: pageSize };
            if (after) query.after = after;

            // Execute request
            ({ error, body } = await apiGet('https://api.twitch.tv/helix/streams', { query, bearer: access_token})
                    .then(body => {
                        return { body, error: null };
                    }, error => {
                        return { error };
                    })
            );

            // If the request failed, handle it
            if (error) {
                // If twitch auth fails - it's likely due to an expired token
                // Clear the session!
                if (error.status === 401) {
                    dispatch(revokeToken());
                }

                dispatch(receiveCustomStreamsError(error));
                callback(error);
                return
            } else {
                // Append the page to the results
                streamList = streamList.concat(body.data);

                // Check if there is another page to fetch
                after = body.pagination.cursor;
                done = !body.pagination.cursor;
            }
        }

        // success
        // dispatch(fetchUsers(streamList.map(s => s.user_id))); // fetch user info
        dispatch(requestCustomStreamsSuccess(streamList));
        callback(null, streamList);

    };
}

//endregion
