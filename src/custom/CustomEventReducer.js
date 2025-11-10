import {
    RECEIVE_CUSTOM_STREAMS_ERROR,
    RECEIVE_CUSTOM_STREAMS_SUCCESS,
    REQUEST_CUSTOM_STREAMS,
    SET_CUSTOM_EVENT_DATA,
    ADD_CUSTOM_EVENT,
    REMOVE_CUSTOM_EVENT,
    SELECT_CUSTOM_EVENT,
    CLEAR_ALL_CUSTOM_EVENTS
} from "../raidpal/RaidPalActions";

export const initialState = {
    // Loaded custom events list (may originate from RaidPal or other sources)
    events: [],
    selectedEventKey: null,

    // Live status for users in the selected custom event lineup
    customEventStreams: {
        isFetching: false,
        lastError: null,
        didInvalidate: false,
        lastUpdated: null,
        data: null
    },
};

export default function CustomEventReducer(state = initialState, action) {
    switch (action.type) {
        case SET_CUSTOM_EVENT_DATA:
        case ADD_CUSTOM_EVENT: {
            if (!action.data) return state;
            const key = action.key;
            if (!key) return state;

            // upsert into events
            const without = state.events.filter(e => e.key !== key);
            const nextEvents = [...without, { key, data: action.data }]
                .sort((a, b) => new Date(a.data.event?.starttime || 0) - new Date(b.data.event?.starttime || 0));

            return {
                ...state,
                events: nextEvents,
                selectedEventKey: key
            };
        }

        case REMOVE_CUSTOM_EVENT: {
            const nextEvents = state.events.filter(e => e.key !== action.key);
            const nextSelected = state.selectedEventKey === action.key ? (nextEvents[0]?.key || null) : state.selectedEventKey;
            return {
                ...state,
                events: nextEvents,
                selectedEventKey: nextSelected,
                customEventStreams: nextSelected ? state.customEventStreams : { ...initialState.customEventStreams }
            };
        }

        case SELECT_CUSTOM_EVENT:
            return {
                ...state,
                selectedEventKey: action.key
            };

        case CLEAR_ALL_CUSTOM_EVENTS:
            return {
                ...state,
                events: [],
                selectedEventKey: null,
                customEventStreams: { ...initialState.customEventStreams }
            };

        case REQUEST_CUSTOM_STREAMS:
            return {
                ...state,
                customEventStreams: {
                    ...state.customEventStreams,
                    isFetching: true,
                }
            };

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

        default:
            return state;
    }
}
