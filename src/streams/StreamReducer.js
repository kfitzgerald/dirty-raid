import {
    RECEIVE_FOLLOWED_STREAMS_ERROR,
    RECEIVE_FOLLOWED_STREAMS_SUCCESS,
    RECEIVE_RAID_START_ERROR,
    RECEIVE_RAID_START_SUCCESS,
    RECEIVE_RAID_STOP_ERROR,
    RECEIVE_RAID_STOP_SUCCESS,
    REQUEST_FOLLOWED_STREAMS,
    REQUEST_RAID_START,
    REQUEST_RAID_STOP
} from "./StreamActions";

const initialState = {

    // State for stream list fetching
    isFetching: false,
    lastError: null,
    didInvalidate: false,
    lastUpdated: null,
    data: null,

    // State for raid start/stop
    raid: {
        isFetching: false,
        isCancelled: false,
        lastError: null,
        lastUpdated: null, // cancel can occur up to 90s after started
        data: null,
    },

    // State for posting a chat announcement
    announcement: {
        isFetching: false,
        lastError: null,
        lastUpdated: null,
        data: null,
    }
};

export default function StreamReducer(state = initialState, action) {
    switch (action.type) {

        case REQUEST_FOLLOWED_STREAMS:
            return {
                ...state,
                isFetching: true,
            }

        case RECEIVE_FOLLOWED_STREAMS_SUCCESS:
            return {
                ...state,
                isFetching: false,
                lastError: null,
                didInvalidate: false,
                lastUpdated: action.lastUpdated,
                data: action.data
            };

        case RECEIVE_FOLLOWED_STREAMS_ERROR:
            return {
                ...state,
                isFetching: false,
                lastError: action.error
            };

        case REQUEST_RAID_START:
            return {
                ...state,
                raid: {
                    ...state.raid,
                    isFetching: true,
                    isCancelled: false,
                }
            };

        case RECEIVE_RAID_START_SUCCESS:
            return {
                ...state,
                raid: {
                    ...state.raid,
                    isFetching: false,
                    lastUpdated: action.lastUpdated,
                    data: action.data
                }
            };

        case RECEIVE_RAID_START_ERROR:
            return {
                ...state,
                raid: {
                    ...state.raid,
                    isFetching: false,
                    lastError: action.error,
                }
            };


        case REQUEST_RAID_STOP:
            return {
                ...state,
                raid: {
                    ...state.raid,
                    isFetching: true,
                    isCancelled: false,
                }
            };

        case RECEIVE_RAID_STOP_SUCCESS:
            return {
                ...state,
                raid: {
                    ...state.raid,
                    isFetching: false,
                    lastUpdated: null,
                    data: null,
                    isCancelled: true
                }
            };

        case RECEIVE_RAID_STOP_ERROR:
            return {
                ...state,
                raid: {
                    ...state.raid,
                    isFetching: false,
                    lastError: action.error,
                }
            };

        default:
            return state;
    }
}

