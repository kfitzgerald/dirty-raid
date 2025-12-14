import { createStore, compose, applyMiddleware } from 'redux';
import persistState from 'redux-localstorage';
import Thunk from 'redux-thunk';

import rootReducer from './reducers';
import {initialSessionState} from "./session/SessionReducer";
import {initialState as initialAppState} from './app/AppReducer';
import {initialState as initialRaidpalState} from './raidpal/RaidPalReducer';
import {initialState as initialCustomEventState} from './custom/CustomEventReducer';
import {initialState as initialUserState} from './users/UserReducer';

let composer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

let enhancers = composer(
    persistState(['session'], {
        key: 'dr_session',
        slicer: (/*paths*/) => {
            return (state) => {
                return {
                    app: {
                        preferences: {
                            ...state.app.preferences,
                        }
                    },
                    custom: {
                        events: state.custom.events,
                        selectedEventKey: state.custom.selectedEventKey,
                    },
                    session: {
                        token: {
                            ...state.session.token || {},
                        }
                    },
                    users: {
                        cache: {
                            ...state.users.cache,
                        }
                    }
                };
            };
        },
        merge: (initialState, persistedState) => {
            if (!persistedState?.session?.token?.access_token) return initialState;
            // TODO: add a check for app version, and only merge if versions match
            return {
                ...initialState, // ignore stored fetching/error states

                app: {
                    ...initialAppState,
                    preferences: {
                        ...initialAppState.preferences,
                        ...persistedState.app.preferences
                    }
                },

                session: {
                    ...initialSessionState,                 // default session state
                    token: {
                        ...persistedState.session.token,    // only persist the token, validation will be done on load
                    }
                },

                custom: {
                    ...initialCustomEventState,
                    events: persistedState.custom?.events || [],
                    selectedEventKey: persistedState.custom?.selectedEventKey || null,
                },

                users: {
                    ...initialUserState,
                    cache: {
                        ...initialUserState.cache,
                        ...persistedState.users.cache
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
