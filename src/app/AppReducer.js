import {APP_CRASH, SET_PREFERENCE} from "./AppActions";

import {DEFAULT_PREFERENCES} from "../common/Constants";

export const initialState = {
    version: process.env.REACT_APP_VERSION,
    appCrashed: false,
    preferences: {
        ...DEFAULT_PREFERENCES,
    }
};

export default function AppReducer(state = initialState, action) {
    switch (action.type) {

        case APP_CRASH:
            return {
                ...state,
                appCrashed: {
                    error: action.error,
                    errorInfo: action.errorInfo
                }
            };

        case SET_PREFERENCE:
            return {
                ...state,
                preferences: {
                    ...state.preferences,
                    [action.key]: action.value
                }
            };

        default:
            return state;
    }
}