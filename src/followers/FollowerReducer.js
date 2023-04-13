import {CLEAR_OAUTH_TOKEN, SET_OAUTH_TOKEN} from "../session/SessionActions";
import {
    ENQUEUE_FOLLOWED_CHANNELS,
    RECEIVE_FOLLOWED_CHANNELS_ERROR,
    RECEIVE_FOLLOWED_CHANNELS_SUCCESS,
    REQUEST_FOLLOWED_CHANNELS
} from "./FollowerActions";

export const initialState = {

    // State for channel follower fetching
    isFetching: false,
    lastError: null,
    didInvalidate: false,
    lastUpdated: null,

    // don't persist this until logout
    cache: {}, // broadcaster_id -> user data

    // channels are fetched in batches on an interval
    queue: [], // broadcaster_id to check or null to fetch full list
};

export default function FollowerReducer(state = initialState, action) {
    switch (action.type) {

        case REQUEST_FOLLOWED_CHANNELS:
            return {
                ...state,
                isFetching: true,
            }

        case RECEIVE_FOLLOWED_CHANNELS_SUCCESS: {
            // update user cache
            let cache = {
                ...state.cache
            };
            action.data.forEach(u => {
                u.lastUpdated = action.lastUpdated; // assign a lastUpdated field for auto refresh
                cache[u.broadcaster_id] = u;
            });

            return {
                ...state,
                isFetching: false,
                lastError: null,
                didInvalidate: false,
                lastUpdated: action.lastUpdated,
                cache
            };
        }

        case RECEIVE_FOLLOWED_CHANNELS_ERROR:
            return {
                ...state,
                isFetching: false,
                lastError: action.error
            };

        case ENQUEUE_FOLLOWED_CHANNELS:
            return {
                ...state,
                queue: [
                    ...state.queue,
                    ...action.user_ids
                ]
            };

        case SET_OAUTH_TOKEN:
        case CLEAR_OAUTH_TOKEN:
            // Purge cache on auth changes
            return {
                ...state,
                queue: [],
                cache: {}
            };

        default:
            return state;
    }
}

