import {
    RECEIVE_CHAT_ANNOUNCEMENT_ERROR,
    RECEIVE_CHAT_ANNOUNCEMENT_SUCCESS, RECEIVE_CHAT_MESSAGE_ERROR, RECEIVE_CHAT_MESSAGE_SUCCESS,
    RECEIVE_FOLLOWED_STREAMS_ERROR,
    RECEIVE_FOLLOWED_STREAMS_SUCCESS,
    RECEIVE_RAID_START_ERROR,
    RECEIVE_RAID_START_SUCCESS,
    RECEIVE_RAID_STOP_ERROR,
    RECEIVE_RAID_STOP_SUCCESS, REQUEST_CHAT_ANNOUNCEMENT, REQUEST_CHAT_MESSAGE,
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
    },

    // State for posting a chat message
    message: {
        isFetching: false,
        lastError: null,
        lastUpdated: null,
        data: null,
    }
};

export default function StreamReducer(state = initialState, action) {
    switch (action.type) {

        //region Followed Stream Actions

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

        //endregion

        //region Raid Start Actions

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

        //endregion

        //region Raid Stop Actions

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

        //endregion

        //region Chat Announcement Actions

        case REQUEST_CHAT_ANNOUNCEMENT:
            return {
                ...state,
                announcement: {
                    ...state.announcement,
                    isFetching: true,
                }
            };

        case RECEIVE_CHAT_ANNOUNCEMENT_SUCCESS:
            return {
                ...state,
                announcement: {
                    ...state.announcement,
                    isFetching: false,
                    lastUpdated: action.lastUpdated,
                    data: action.data,
                    lastError: null,
                }
            };

        case RECEIVE_CHAT_ANNOUNCEMENT_ERROR:
            return {
                ...state,
                announcement: {
                    ...state.announcement,
                    isFetching: false,
                    lastError: action.error,
                }
            };

        //endregion

        //region Chat Message Actions

        case REQUEST_CHAT_MESSAGE:
            return {
                ...state,
                message: {
                    ...state.message,
                    isFetching: true,
                }
            };

        case RECEIVE_CHAT_MESSAGE_SUCCESS:
            return {
                ...state,
                message: {
                    ...state.message,
                    isFetching: false,
                    lastUpdated: action.lastUpdated,
                    data: action.data,
                    lastError: null,
                }
            };

        case RECEIVE_CHAT_MESSAGE_ERROR:
            return {
                ...state,
                message: {
                    ...state.message,
                    isFetching: false,
                    lastError: action.error,
                }
            };

        //endregion

        default:
            return state;
    }
}

