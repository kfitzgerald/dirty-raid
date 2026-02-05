import {Alert, Container, Nav, NavDropdown} from "react-bootstrap";
import {useDispatch, useSelector} from "react-redux";
import {useCallback, useEffect, useState} from "react";
import {fetchTeamMembers, fetchTeamStreams, fetchUsersTeams} from "./TeamsActions";
import ReUsableStreamList from "../streams/ReUsableStreamList";
import ShowMoreText from "react-show-more-text";
import {REFRESH_INTERVAL} from "../streams/StreamList";
import "./TeamsView.scss";
import ErrorMessage from "../common/ErrorMessage";
import {fetchUsers} from "../users/UserActions";


function getTeamUserIds(team, user_id) {
    // unique ids of team members excluding ourselves and empty slots
    const ids = new Set(team.users
        .map(user => user.user_id)
        .filter(id => !!id)
    );

    const uniqueIds = Array.from(ids);
    const uniqueIdsExcludingSelf = uniqueIds.filter(id => id !== user_id);

    return { uniqueIds, uniqueIdsExcludingSelf };
}

export default function TeamsView() {
    const dispatch = useDispatch();
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const isTeamsFetching = useSelector(state => state.teams.isFetching);
    const teamsLastError = useSelector(state => state.teams.lastError);
    const teamsData = useSelector(state => state.teams.data);
    const teamStreamData = useSelector(state => state.teams.streams.data);
    const isStreamsFetching = useSelector(state => state.teams.streams.isFetching);
    const streamsLastUpdated = useSelector(state => state.teams.streams.lastUpdated);
    const { user_id } = useSelector(state => state.session.data);

    const selectedTeam = (teamsData && selectedTeamId && teamsData.find(team => team.id === selectedTeamId)) || null;

    const handleTeamChange = useCallback((teamId) => {
        setSelectedTeamId(teamId);
        dispatch(fetchTeamMembers(teamId, (err, team) => {
            if (team) {
                const { uniqueIds} =  getTeamUserIds(team[0], user_id);
                dispatch(fetchTeamStreams(uniqueIds, (err, streamList) => {
                    if (streamList) {
                        const uniqueIds = Array.from(
                            new Set(streamList.filter(s => s.user_id !== user_id).map(s => s.user_id))
                        );

                        // Fetch channel info
                        dispatch(fetchUsers(uniqueIds));
                    }
                }));
            }
        }));
    }, [dispatch, user_id]);

    const handleRefresh = useCallback(() => {
        if (selectedTeamId) {
            dispatch(fetchTeamMembers(selectedTeamId, (err, team) => {
                if (team) {
                    const { uniqueIds} =  getTeamUserIds(team[0], user_id);
                    dispatch(fetchTeamStreams(uniqueIds, (err, streamList) => {
                        if (streamList) {
                            const uniqueIds = Array.from(
                                new Set(streamList.filter(s => s.user_id !== user_id).map(s => s.user_id))
                            );

                            // Fetch channel info
                            dispatch(fetchUsers(uniqueIds));
                        }
                    }));
                }
            }));
        }
    }, [dispatch, selectedTeamId, user_id]);

    useEffect(() => {
        const streamRefreshInterval = setInterval(() => {
            handleRefresh();
        }, REFRESH_INTERVAL);

        // Cleanup
        return () => {
            clearInterval(streamRefreshInterval);
        };
    }, [dispatch, handleRefresh]);

    useEffect(() => {
        dispatch(fetchUsersTeams((err, data) => {
            if (data?.length) {
                handleTeamChange(data[0].id)
            }
        }));
    },[dispatch, handleTeamChange])

    if (!isTeamsFetching && !teamStreamData) {
        // the tab shouldn't be shown if there are no teams so no need to render anything
        return null

    }

    return <Container>
        {teamsLastError && (
            <Alert variant="danger" className="mt-3">
                <ErrorMessage error={teamsLastError} />
            </Alert>
        )}
        <div className="display-opts">
            <label>Your Teams</label>
        </div>

        {(!isTeamsFetching && teamStreamData) ? (
            <>
                <Nav activeKey={selectedTeamId} className="flex-column event-list mb-3" onSelect={handleTeamChange}>
                    {!teamsData?.length ? (
                        <Nav.Item className="static"><Alert variant="warning" className="mt-3">You do not appear to be a member of any teams :(</Alert></Nav.Item>
                    ) : (
                        <NavDropdown placement="bottom" menuVariant="dark" title={<span>{selectedTeam?.team_display_name || 'Select twitch team...'}</span>}>
                            {teamsData.map((team) => {
                                return (
                                    <NavDropdown.Item key={team.id} eventKey={team.id}>
                                        <span className="title">{team.team_display_name}</span>
                                    </NavDropdown.Item>
                                );
                            })}
                        </NavDropdown>
                    )}
                </Nav>
                <hr />
                <ShowMoreText lines={3} className="description mb-3">
                    {selectedTeam?.info}
                </ShowMoreText>
                <hr />
                {(!teamStreamData?.length && !isStreamsFetching) ? (
                    <div className="no-streams">
                        <Alert variant="warning">That's weird, none of your team members are online :(</Alert>
                    </div>
                ) : null}
                {teamStreamData?.length ? (
                    <ReUsableStreamList
                        handleRefresh={handleRefresh}
                        streams={teamStreamData}
                        lastUpdated={streamsLastUpdated}
                        isFetching={isStreamsFetching}
                    />
                ) : null}
            </>
        ) : null}
        {teamsLastError && (
            <Alert variant="danger" className="mt-3">
                <ErrorMessage error={teamsLastError} />
            </Alert>
        )}

    </Container>
}
