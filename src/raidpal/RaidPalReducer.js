import {
    getSlug, RECEIVE_CUSTOM_STREAMS_ERROR, RECEIVE_CUSTOM_STREAMS_SUCCESS,
    RECEIVE_RAIDPAL_EVENT_ERROR,
    RECEIVE_RAIDPAL_EVENT_SUCCESS,
    RECEIVE_RAIDPAL_USER_ERROR,
    RECEIVE_RAIDPAL_USER_SUCCESS, RECEIVE_USER_STREAMS_ERROR, RECEIVE_USER_STREAMS_SUCCESS, REQUEST_CUSTOM_STREAMS,
    REQUEST_RAIDPAL_EVENT,
    REQUEST_RAIDPAL_USER, REQUEST_USER_STREAMS, SET_CUSTOM_EVENT_DATA
} from "./RaidPalActions";

export const initialState = {

    // State for user fetch
    isFetching: false,
    lastError: null,
    didInvalidate: false,
    lastUpdated: null,
    data: null,

    // Individual event states
    events: {
        isFetching: false,
        lastError: null,
        didInvalidate: false,
        lastUpdated: null,

        cache: {} // raidpal_link -> data
    },

    // Lineup streamer status (who is live on the lineup rn)
    streams: {
        isFetching: false,
        lastError: null,
        didInvalidate: false,
        lastUpdated: null,
        data: null
    },

    // Custom raidpal format event
    customEvent: null,

    // Custom event streams
    customEventStreams: {
        isFetching: false,
        lastError: null,
        didInvalidate: false,
        lastUpdated: null,
        data: null
    },

};

export default function RaidPalReducer(state = initialState, action) {
    switch (action.type) {

        //region User

        case REQUEST_RAIDPAL_USER:
            return {
                ...state,
                isFetching: true,
            }

        case RECEIVE_RAIDPAL_USER_SUCCESS: {
            return {
                ...state,
                isFetching: false,
                lastError: null,
                didInvalidate: false,
                lastUpdated: action.lastUpdated,
                data: action.data
            };
        }

        case RECEIVE_RAIDPAL_USER_ERROR:
            return {
                ...state,
                isFetching: false,
                lastError: action.error
            };

        //endregion

        //region Event

        case REQUEST_RAIDPAL_EVENT:
            return {
                ...state,
                events: {
                    ...state.events,
                    isFetching: true,
                }
            };

        case RECEIVE_RAIDPAL_EVENT_SUCCESS: {
            return {
                ...state,
                events: {
                    ...state.events,
                    isFetching: false,
                    lastError: null,
                    didInvalidate: false,
                    lastUpdated: action.lastUpdated,
                    cache: {
                        ...state.events.cache,
                        [getSlug(action.data.raidpal_link)]: action.data
                    }
                }
            };
        }

        case RECEIVE_RAIDPAL_EVENT_ERROR:
            return {
                ...state,
                events: {
                    ...state.events,
                    isFetching: false,
                    lastError: action.error
                }
            };

        //endregion

        //region User Streams

        case REQUEST_USER_STREAMS:
            return {
                ...state,
                streams: {
                    ...state.streams,
                    isFetching: true,
                }
            }

        case RECEIVE_USER_STREAMS_SUCCESS:
            return {
                ...state,
                streams: {
                    ...state.streams,
                    isFetching: false,
                    lastError: null,
                    didInvalidate: false,
                    lastUpdated: action.lastUpdated,
                    data: action.data
                }
            };

        case RECEIVE_USER_STREAMS_ERROR:
            return {
                ...state,
                streams: {
                    ...state.streams,
                    isFetching: false,
                    lastError: action.error
                }
            };

        //endregion

        //region Custom Events

        case SET_CUSTOM_EVENT_DATA:
            return {
                ...state,
                customEvent: action.data
            };

        //endregion

        //region Custom Streams

        case REQUEST_CUSTOM_STREAMS:
            return {
                ...state,
                customEventStreams: {
                    ...state.customEventStreams,
                    isFetching: true,
                }
            }

        case RECEIVE_CUSTOM_STREAMS_SUCCESS:
            return {
                ...state,
                customEventStreams: {
                    ...state.customEventStreams,
                    isFetching: false,
                    lastError: null,
                    didInvalidate: false,
                    lastUpdated: action.lastUpdated,
                    data: action.data
                }
            };

        case RECEIVE_CUSTOM_STREAMS_ERROR:
            return {
                ...state,
                customEventStreams: {
                    ...state.customEventStreams,
                    isFetching: false,
                    lastError: action.error
                }
            };

        //endregion

        default:
            return state;
    }
}

