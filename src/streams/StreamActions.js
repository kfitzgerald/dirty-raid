import {apiDelete, apiGet, apiPost} from "../common/API";
import {revokeToken} from "../session/SessionActions";
import {fetchUsers} from "../users/UserActions";

//region Twitch Followed Streams

export const REQUEST_FOLLOWED_STREAMS = 'REQUEST_FOLLOWED_STREAMS';
export function requestFollowedStreams() {
    return {
        type: REQUEST_FOLLOWED_STREAMS
    };
}

export const RECEIVE_FOLLOWED_STREAMS_SUCCESS = 'RECEIVE_FOLLOWED_STREAMS_SUCCESS';
export function requestFollowedStreamsSuccess(data) {
    return {
        type: RECEIVE_FOLLOWED_STREAMS_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_FOLLOWED_STREAMS_ERROR = 'RECEIVE_FOLLOWED_STREAMS_ERROR';
export function receiveFollowedStreamsError(error) {
    return {
        type: RECEIVE_FOLLOWED_STREAMS_ERROR,
        error
    };
}

/**
 * Fetch followed stream list
 * @param callback
 * @return {(function(*, *): void)|*}
 */
export function fetchFollowedStreams(callback=() => {}) {
    return async (dispatch, getState) => {
        const { session, streams } = getState();
        if (streams.isFetching) return; // no dup requests
        if (!session.data) return; // no auth, no request

        const { user_id } = session.data
        const { access_token } = session.token;

        dispatch(requestFollowedStreams());

        const pageSize = 100;
        let streamList = [];
        let done = false, body, error, after, query;
        while (!done) { // ooo scary!

            // Build query
            query = { user_id, first: pageSize, /*after: ...*/ };
            if (after) query.after = after;

            // Execute request
            ({ error, body } = await apiGet('https://api.twitch.tv/helix/streams/followed', { query, bearer: access_token})
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

                dispatch(receiveFollowedStreamsError(error));
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
        dispatch(fetchUsers(streamList.map(s => s.user_id))); // fetch user info
        dispatch(requestFollowedStreamsSuccess(streamList));
        callback(null, streamList);

    };
}

//endregion

//region Raid Shadow Legends

export const REQUEST_RAID_START = 'REQUEST_RAID_START';
export function requestRaidStart({ to_broadcaster_id }) {
    return {
        type: REQUEST_RAID_START,
        to_broadcaster_id
    };
}

export const RECEIVE_RAID_START_SUCCESS = 'RECEIVE_RAID_START_SUCCESS';
export function requestRaidStartSuccess(data) {
    return {
        type: RECEIVE_RAID_START_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_RAID_START_ERROR = 'RECEIVE_RAID_START_ERROR';
export function receiveRaidStartError(error) {
    return {
        type: RECEIVE_RAID_START_ERROR,
        error
    };
}

/**
 * Start a raid!
 * @param to_broadcaster_id
 * @param callback
 * @return {(function(*, *): void)|*}
 */
export function fetchRaidStart(to_broadcaster_id, callback=() => {}) {
    return (dispatch, getState) => {
        const { session, streams } = getState();
        if (streams.raid.isFetching) return; // no dup requests
        if (!session.data) return; // no auth, no request

        const { user_id } = session.data
        const { access_token } = session.token;

        dispatch(requestRaidStart({ to_broadcaster_id }));

        apiPost('https://api.twitch.tv/helix/raids', { query: { from_broadcaster_id: user_id, to_broadcaster_id }, bearer: access_token })
            .then(body => {
                dispatch(requestRaidStartSuccess(body.data));
                callback(null, body.data);
            }, err => {

                // If twitch auth fails - it's likely due to an expired token
                // Clear the session!
                if (err.status === 401) {
                    dispatch(revokeToken());
                }

                dispatch(receiveRaidStartError(err));
                callback(err);
            })
        ;
    };
}

//endregion

//region Post Chat Announcement

export const REQUEST_CHAT_ANNOUNCEMENT = 'REQUEST_CHAT_ANNOUNCEMENT';
export function requestChatAnnouncement() {
    return {
        type: REQUEST_CHAT_ANNOUNCEMENT,
    };
}

export const RECEIVE_CHAT_ANNOUNCEMENT_SUCCESS = 'RECEIVE_CHAT_ANNOUNCEMENT_SUCCESS';
export function requestChatAnnouncementSuccess(data) {
    return {
        type: RECEIVE_CHAT_ANNOUNCEMENT_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_CHAT_ANNOUNCEMENT_ERROR = 'RECEIVE_CHAT_ANNOUNCEMENT_ERROR';
export function receiveChatAnnouncementError(error) {
    return {
        type: RECEIVE_CHAT_ANNOUNCEMENT_ERROR,
        error
    };
}

/**
 * Post an announcement to the channel
 * @param message
 * @param color
 * @param [callback]
 * @return {(function(*, *): void)|*}
 */
export function postChannelMessage(message, color, callback=() => {}) {
    return (dispatch, getState) => {
        const { session, streams } = getState();
        if (streams.announcement.isFetching) return; // no dup requests
        if (!session.data) return; // no auth, no request

        const { user_id } = session.data;
        const { access_token } = session.token;

        dispatch(requestChatAnnouncement());

        apiPost('https://api.twitch.tv/helix/chat/announcements', {
            query: {
                broadcaster_id: user_id,
                moderator_id: user_id,
                message,
                color
            },
            bearer: access_token
        })
            .then(body => {
                dispatch(requestChatAnnouncementSuccess(body.data))
                callback(null, body.data);
            }, err => {

                // If twitch auth fails - it's likely due to an expired token
                // Clear the session!
                if (err.status === 401) {
                    dispatch(revokeToken());
                }

                dispatch(receiveChatAnnouncementError(err));
                callback(err);
            })
        ;
    };
}

//endregion

//region Cancel Raid

export const REQUEST_RAID_STOP = 'REQUEST_RAID_STOP';
export function requestRaidStop() {
    return {
        type: REQUEST_RAID_STOP,
    };
}

export const RECEIVE_RAID_STOP_SUCCESS = 'RECEIVE_RAID_STOP_SUCCESS';
export function requestRaidStopSuccess(data) {
    return {
        type: RECEIVE_RAID_STOP_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_RAID_STOP_ERROR = 'RECEIVE_RAID_STOP_ERROR';
export function receiveRaidStopError(error) {
    return {
        type: RECEIVE_RAID_STOP_ERROR,
        error
    };
}

/**
 * Stops the active raid
 * @param callback
 * @return {(function(*, *): void)|*}
 */
export function fetchRaidStop(callback=() => {}) {
    return (dispatch, getState) => {
        const { session, streams } = getState();
        if (streams.isFetching) return; // no dup requests
        if (!session.data) return; // no auth, no request

        const { user_id } = session.data
        const { access_token } = session.token;

        dispatch(requestRaidStop());

        apiDelete('https://api.twitch.tv/helix/raids', { query: { broadcaster_id: user_id }, bearer: access_token })
            .then(() => {
                dispatch(requestRaidStopSuccess());
                callback(null);
            }, err => {

                // If twitch auth fails - it's likely due to an expired token
                // Clear the session!
                if (err.status === 401) {
                    dispatch(revokeToken());

                } else if (err.status === 404) {
                    // it's ok - it's already cancelled
                    dispatch(requestRaidStopSuccess());
                    callback(null);
                    return;
                }

                dispatch(receiveRaidStopError(err));
                callback(err);
            })
        ;
    };
}

//endregion



