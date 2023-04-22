import {apiGet} from "../common/API";
import {
    revokeToken
} from "../session/SessionActions";

//region User Teams

export const REQUEST_USERS_TEAMS = "REQUEST_USERS_TEAMS";
export function requestUsersTeams() {
    return {
        type: REQUEST_USERS_TEAMS
    };
}

export const RECEIVE_USERS_TEAMS_SUCCESS = "RECEIVE_USERS_TEAMS_SUCCESS";

export function requestUsersTeamsSuccess(data) {
    return {
        type: RECEIVE_USERS_TEAMS_SUCCESS,
        lastUpdated: Date.now(),
        data
    }
}

export const RECEIVE_USERS_TEAMS_ERROR = "RECEIVE_USERS_TEAMS_ERROR";

export function receiveUsersTeamsError(error) {
    return {
        type: RECEIVE_USERS_TEAMS_ERROR,
        error
    }
}

export function fetchUsersTeams(callback = () => {}) {
    return async (dispatch, getState) => {
        const { teams, session } = getState();
        if(teams.isFetching) return;
        if(!session.data) return;

        const { user_id } = session.data;
        const { access_token } = session.token;

        dispatch(requestUsersTeams());
        const query = {broadcaster_id: user_id}
        apiGet(`https://api.twitch.tv/helix/teams/channel`, {query, bearer: access_token})
            .then(body => {
                if(body?.data) {
                    dispatch(requestUsersTeamsSuccess(body.data));
                    callback(null, body.data);
                } else {
                    dispatch(receiveUsersTeamsError(body));
                    callback(body);
                }
            })
    }
}

// endregion

//region Team Data

export const REQUEST_TEAM_DATA = "REQUEST_TEAM_DATA";
export function requestTeamData() {
    return {
        type: REQUEST_TEAM_DATA
    }
}

export const RECEIVE_TEAM_DATA_SUCCESS = "RECEIVE_TEAM_DATA_SUCCESS";
export function receiveTeamDataSuccess(data) {
    return {
        type: RECEIVE_TEAM_DATA_SUCCESS,
        lastUpdated: Date.now(),
        data
    }
}

export const RECEIVE_TEAM_DATA_ERROR = "RECEIVE_TEAM_DATA_ERROR";
export function receiveTeamDataError(error) {
    return {
        type: RECEIVE_TEAM_DATA_ERROR,
        error
    }
}

export function fetchTeamMembers(team_id, callback = () => {}) {
    return async (dispatch, getState) => {

        const { session } = getState();
        if (!session.data) return; // no auth, no request

        const { access_token } = session.token;
        const query = {id: team_id};

        dispatch(requestTeamData());

        apiGet('https://api.twitch.tv/helix/teams', { query, bearer: access_token})
            .then(body => {
                if(body?.data) {
                    dispatch(receiveTeamDataSuccess(body.data));
                    callback(null, body.data);
                } else {
                    dispatch(receiveTeamDataError(body));
                    callback(body);
                }
            }, err => {
                dispatch(receiveTeamDataError(err));
                if (err.status === 401) {
                    dispatch(revokeToken());
                }
                callback(err);
            })

    }
}

//endregion

//region Twitch User Streams (not necessarily followers)

export const REQUEST_TEAM_STREAMS = 'REQUEST_TEAM_STREAMS';
export function requestTeamStreams() {
    return {
        type: REQUEST_TEAM_STREAMS
    };
}

export const RECEIVE_TEAM_STREAMS_SUCCESS = 'RECEIVE_TEAM_STREAMS_SUCCESS';
export function requestTeamStreamsSuccess(data) {
    return {
        type: RECEIVE_TEAM_STREAMS_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_TEAM_STREAMS_ERROR = 'RECEIVE_TEAM_STREAMS_ERROR';
export function receiveTeamStreamsError(error) {
    return {
        type: RECEIVE_TEAM_STREAMS_ERROR,
        error
    };
}

/**
 * Fetch arbitrary user stream list
 * @param user_ids
 * @param callback
 * @return {(function(*, *): void)|*}
 */
export function fetchTeamStreams(user_ids, callback=() => {}) {
    return async (dispatch, getState) => {

        const { session } = getState();
        if (!session.data) return; // no auth, no request

        const { access_token } = session.token;

        dispatch(requestTeamStreams());

        const queue = [].concat(user_ids);
        const pageSize = 100;
        let streamList = [];
        let ids, done = false, body, error, after, query;
        while (!done) { // ooo scary!

            // pull a batch of ids
            ids = queue.splice(0, 100);

            // Build query
            query = { user_id: ids, first: pageSize };
            if (after) query.after = after;

            // Execute request
            ({ error, body } = await apiGet('https://api.twitch.tv/helix/streams', { query, bearer: access_token})
                    .then(body => {
                        return { body, error: null };
                    }, error => {
                        return { error };
                    })
            );

            // If the request failed, handle it
            if (error) {
                // If twitch auth fails - it's likely due to an expired token
                // Clear the session!
                if (error.status === 401) {
                    dispatch(revokeToken());
                }

                dispatch(receiveTeamStreamsError(error));
                callback(error);
                return
            } else {
                // Append the page to the results
                streamList = streamList.concat(body.data);

                // Check if there is another page to fetch
                after = body.pagination.cursor;
                done = !body.pagination.cursor;
            }
        }

        // success
        dispatch(requestTeamStreamsSuccess(streamList));
        callback(null, streamList);

    };
}

//endregion