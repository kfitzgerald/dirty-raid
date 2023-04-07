import {ENQUEUE_USERS, RECEIVE_USERS_ERROR, RECEIVE_USERS_SUCCESS, REQUEST_USERS} from "./UserActions";
import {RECEIVE_TOKEN_VALIDATE_SUCCESS} from "../session/SessionActions";

export const initialState = {

    // State for user fetching
    isFetching: false,
    lastError: null,
    didInvalidate: false,
    lastUpdated: null,

    // can persist this
    cache: {}, // userid -> user data

    // users are fetched in batches on an interval
    queue: [], // userid list to fetch
};

export default function UserReducer(state = initialState, action) {
    switch (action.type) {

        case REQUEST_USERS:
            return {
                ...state,
                isFetching: true,
            }

        case RECEIVE_USERS_SUCCESS: {
            // update user cache
            let cache = {
                ...state.cache
            };
            action.data.forEach(u => {
                u.lastUpdated = action.lastUpdated; // assign a lastUpdated field for auto refresh
                cache[u.id] = u;
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

        case RECEIVE_USERS_ERROR:
            return {
                ...state,
                isFetching: false,
                lastError: action.error
            };

        case ENQUEUE_USERS:
            return {
                ...state,
                queue: [
                    ...state.queue,
                    ...action.user_ids
                ]
            };

        case RECEIVE_TOKEN_VALIDATE_SUCCESS:
            return {
                ...state,
                queue: [
                    ...state.queue,
                    action.data.user_id // insert logged-in user to the cache queue to fetch on next pull
                ]
            }

        default:
            return state;
    }
}

