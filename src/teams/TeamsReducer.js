import {
    REQUEST_USERS_TEAMS,
    RECEIVE_USERS_TEAMS_SUCCESS,
    RECEIVE_USERS_TEAMS_ERROR,
    REQUEST_TEAM_STREAMS,
    RECEIVE_TEAM_STREAMS_SUCCESS,
    RECEIVE_TEAM_STREAMS_ERROR
} from './TeamsActions';

export const initialState = {
    // State for user teams fetch
    isFetching: false,
    lastError: null,
    didInvalidate: false,
    lastUpdated: null,
    data: null,

    streams: {
        isFetching: false,
        lastError: null,
        didInvalidate: false,
        lastUpdated: null,
        data: null
    }
}

export default function TeamsReducer(state = initialState, action) {
    switch (action.type) {

        //region Teams

        case REQUEST_USERS_TEAMS:
            return {
                ...state,
                isFetching: true
            }

        case RECEIVE_USERS_TEAMS_SUCCESS:
            return {
                ...state,
                isFetching: false,
                lastError: null,
                didInvalidate: false,
                lastUpdated: action.lastUpdated,
                data: action.data
            }

        case RECEIVE_USERS_TEAMS_ERROR:
            return {
                ...state,
                isFetching: false,
                lastError: action.error
            };

        //endregion

        //region Team Streams

        case REQUEST_TEAM_STREAMS:
            return {
                ...state,
                streams: {
                    ...state.streams,
                    isFetching: true,
                }
            }

        case RECEIVE_TEAM_STREAMS_SUCCESS:
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

        case RECEIVE_TEAM_STREAMS_ERROR:
            return {
                ...state,
                streams: {
                    ...state.streams,
                    isFetching: false,
                    lastError: action.error
                }
            };

        //endregion

        default:
            return state;

    }
}