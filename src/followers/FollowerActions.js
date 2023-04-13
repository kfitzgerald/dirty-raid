import {apiGet} from "../common/API";
import {revokeToken} from "../session/SessionActions";

//region Twitch Get Followed Channels

export const REQUEST_FOLLOWED_CHANNELS = 'REQUEST_FOLLOWED_CHANNELS';
export function requestFollowedChannels() {
    return {
        type: REQUEST_FOLLOWED_CHANNELS
    };
}

export const RECEIVE_FOLLOWED_CHANNELS_SUCCESS = 'RECEIVE_FOLLOWED_CHANNELS_SUCCESS';
export function requestFollowedChannelsSuccess(data) {
    return {
        type: RECEIVE_FOLLOWED_CHANNELS_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_FOLLOWED_CHANNELS_ERROR = 'RECEIVE_FOLLOWED_CHANNELS_ERROR';
export function receiveFollowedChannelsError(error) {
    return {
        type: RECEIVE_FOLLOWED_CHANNELS_ERROR,
        error
    };
}

export const ENQUEUE_FOLLOWED_CHANNELS = 'ENQUEUE_FOLLOWED_CHANNELS';
export function enqueueFollowedChannels(user_ids) {
    return {
        type: ENQUEUE_FOLLOWED_CHANNELS,
        user_ids
    };
}

export function fetchFollowedChannels(broadcaster_ids) {
    return async (dispatch, getState) => {
        const { followers } = getState();
        const { cache, queue } = followers;

        // only queue if user is not following this broadcaster and not cached
        const filteredIds = broadcaster_ids.filter(broadcaster_id => {
            return (!broadcaster_id || // fetch all
                !cache[broadcaster_id] || // not cached?
                !cache[broadcaster_id].followed_at) && // not followed
                queue.indexOf(broadcaster_id) < 0 // not queued
            ;
        });

        if (!filteredIds.length) return;

        // Add to the queue
        dispatch(enqueueFollowedChannels(filteredIds));
        dispatch(_fetchFollowedChannels());
    };
}


function _fetchFollowedChannels(callback=() => {}) {
    return async (dispatch, getState) => {
        const { followers, session } = getState();
        const { queue, isFetching } = followers;

        if (isFetching) return; // no dup fetching
        if (!session.data) return; // no auth, no request
        if (!queue.length) return; // no users to fetch

        const { access_token } = session.token;
        const { user_id } = session.data;

        // lock out dup fetch requests
        dispatch(requestFollowedChannels());

        const pageSize = 100;
        let followList = [];
        let broadcaster_id;
        while (queue.length > 0) {

            broadcaster_id = queue.shift();

            let done = false, body, error, after, query;
            while (!done) { // ooo scary!

                // Build query
                query = { user_id, first: pageSize, /*after: ...*/ };
                if (broadcaster_id) query.broadcaster_id = broadcaster_id;
                if (after) query.after = after;

                // Execute request
                ({ error, body } = await apiGet('https://api.twitch.tv/helix/channels/followed', { query, bearer: access_token})
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

                    dispatch(receiveFollowedChannelsError(error));
                    callback(error);
                    dispatch(_fetchFollowedChannels());
                    return;

                } else {
                    // Append the page to the results
                    if (broadcaster_id && body.data.length === 0) {
                        // create a stub record for users that are not following
                        body.data = [
                            {
                                broadcaster_id,
                            }
                        ];
                    }
                    followList = followList.concat(body.data);

                    // Check if there is another page to fetch
                    after = body.pagination.cursor;
                    done = !body.pagination.cursor;
                }
            }

        }

        // success - update the cache and release the fetch lock
        dispatch(requestFollowedChannelsSuccess(followList));
        callback(null, followList);

        // do another follow up just in case the queue is still long
        dispatch(_fetchFollowedChannels());
    };
}

//endregion