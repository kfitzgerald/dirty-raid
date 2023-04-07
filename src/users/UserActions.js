import {apiGet} from "../common/API";
import {revokeToken} from "../session/SessionActions";

//region Twitch Get Users

export const REQUEST_USERS = 'REQUEST_USERS';
export function requestUsers() {
    return {
        type: REQUEST_USERS
    };
}

export const RECEIVE_USERS_SUCCESS = 'RECEIVE_USERS_SUCCESS';
export function requestUsersSuccess(data) {
    return {
        type: RECEIVE_USERS_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_USERS_ERROR = 'RECEIVE_USERS_ERROR';
export function receiveUsersError(error) {
    return {
        type: RECEIVE_USERS_ERROR,
        error
    };
}

export const ENQUEUE_USERS = 'ENQUEUE_USERS';
export function enqueueUsers(user_ids) {
    return {
        type: ENQUEUE_USERS,
        user_ids
    };
}

const REFRESH_TIMEOUT = 3600000; // refresh profile data after 1 hour

export function fetchUsers(user_ids, refresh=false) {
    return async (dispatch, getState) => {
        const { users } = getState();
        const { cache } = users;
        const expiry = Date.now() - REFRESH_TIMEOUT;
        const filteredIds = refresh ? user_ids : user_ids.filter(id =>
            !cache[id] ||                   // not cached
            !cache[id].lastUpdated ||       // no updated value
            cache[id].lastUpdated < expiry  // expired from cache
        );

        if (!filteredIds.length && !cache.length) return; // nothing to do

        // Add the users to the queue
        // If refresh is true, then fetch all user ids
        // If not, only queue the ones not already cached
        dispatch(enqueueUsers(filteredIds));
        dispatch(_fetchUsers());
    };
}


function _fetchUsers(callback=() => {}) {
    return async (dispatch, getState) => {
        const { users, session } = getState();
        const { queue, isFetching } = users;

        if (isFetching) return; // no dup fetching
        if (!session.data) return; // no auth, no request
        if (!queue.length) return; // no users to fetch

        const { access_token } = session.token;

        // lock out dup fetch requests
        dispatch(requestUsers());

        let userList = [];
        let ids, body, error, query;
        while (queue.length > 0) {

            // Build query
            ids = [...new Set(queue.splice(0, 100))]; // batches of 100 max, unique ids
            query = { id: ids };

            // Execute request
            ({ error, body } = await apiGet('https://api.twitch.tv/helix/users', { query, bearer: access_token})
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

                dispatch(receiveUsersError(error));
                callback(error);
                return;

            } else {
                // Append the users to the received list
                userList = userList.concat(body.data);
            }
        }

        // success - update the cache and release the fetch lock
        dispatch(requestUsersSuccess(userList));
        callback(null, userList);
    };
}

//endregion