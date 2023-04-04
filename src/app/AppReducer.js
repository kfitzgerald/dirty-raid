import {APP_CRASH} from "./AppActions";

const initialState = {
    version: process.env.REACT_APP_VERSION,
    appCrashed: false,
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

        default:
            return state;
    }
}