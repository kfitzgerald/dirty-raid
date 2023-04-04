import { createStore, compose, applyMiddleware } from 'redux';
import persistState from 'redux-localstorage';
import Thunk from 'redux-thunk';

import rootReducer from './reducers';
import {initialSessionState} from "./session/SessionReducer";

let composer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

let enhancers = composer(
    persistState(['session'], {
        key: 'dr_session',
        slicer: (/*paths*/) => {
            return (state) => {
                return {
                    session: state.session,
                };
            };
        },
        merge: (initialState, persistedState) => {
            if (!persistedState?.session?.token?.access_token) return initialState;
            // TODO: add a check for app version, and only merge if versions match
            return {
                ...initialState, // ignore stored fetching/error states
                session: {
                    ...initialSessionState,                 // default session state
                    token: {
                        ...persistedState.session.token,    // only persist the token, validation will be done on load
                    }

                }
            };
        }
    }),
    applyMiddleware(Thunk)
);

const configureStore = preloadedState => createStore(
    rootReducer,
    preloadedState,
    enhancers
);

export default configureStore;