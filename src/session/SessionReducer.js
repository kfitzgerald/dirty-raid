import {
    CLEAR_OAUTH_TOKEN,
    RECEIVE_TOKEN_VALIDATE_ERROR,
    RECEIVE_TOKEN_VALIDATE_SUCCESS,
    REQUEST_TOKEN_VALIDATE,
    SET_OAUTH_TOKEN
} from "./SessionActions";

export const initialSessionState = {

    // access stuffs (persisted)
    token: {
        access_token: null,
        scope: null,
        state: null,
        token_type: null,
    },

    // validate / whoami
    isFetching: false,
    lastError: null,
    didInvalidate: false,
    lastUpdated: null,

    // Validation result (not persisted - revalidated on each app load)
    data: null
    // data: {
    //     "client_id": "asdfasdfasdf",
    //     "login": "twitchdev",
    //     "scopes": [
    //         "channel:read:subscriptions"
    //     ],
    //     "user_id": "123456789",
    //     "expires_in": 5520838
    // }

};

export default function SessionReducer(state = initialSessionState, action) {
    switch (action.type) {

        case SET_OAUTH_TOKEN:
            return {
                ...state,
                token: action.data,
            };

        case CLEAR_OAUTH_TOKEN:
            return {
                ...state,
                token: {
                    ...initialSessionState.token
                },
                data: null
            };

        case REQUEST_TOKEN_VALIDATE:
            return {
                ...state,
                isFetching: true,

            };

        case RECEIVE_TOKEN_VALIDATE_SUCCESS:
            return {
                ...state,
                isFetching: false,
                lastError: null,
                didInvalidate: false,
                lastUpdated: action.lastUpdated,
                data: action.data
            };

        case RECEIVE_TOKEN_VALIDATE_ERROR:
            return {
                ...state,
                isFetching: false,
                lastError: action.error
            };

        default:
            return state;
    }
}

