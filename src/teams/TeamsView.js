import {Alert, Container, Nav, NavDropdown} from "react-bootstrap";
import {useDispatch, useSelector} from "react-redux";
import {useCallback, useEffect, useState} from "react";
import {fetchTeamMembers, fetchTeamStreams, fetchUsersTeams} from "./TeamsActions";
import ReUsableStreamList from "../streams/ReUsableStreamList";
import ShowMoreText from "react-show-more-text";
import {REFRESH_INTERVAL} from "../streams/StreamList";
import sadLogo from "../sad-logo.svg";
import "./TeamsView.scss";


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
    const { isFetching: isTeamsFetching, lastError: teamsLastError, data: teamsData, streams: teamStreams } = useSelector(state => state.teams);
    const { data:teamStreamData, isFetching: isStreamsFetching, lastUpdated: streamsLastUpdated } = teamStreams
    const { user_id } = useSelector(state => state.session.data);

    const selectedTeam = (teamsData && selectedTeamId && teamsData.find(team => team.id === selectedTeamId)) || null;

    const handleTeamChange = useCallback((teamId) => {
        setSelectedTeamId(teamId);
        dispatch(fetchTeamMembers(teamId, (err, team) => {
            if(team) {
                const { uniqueIds} =  getTeamUserIds(team[0], user_id);
                dispatch(fetchTeamStreams(uniqueIds));
            }
        }));
    }, [dispatch, user_id]);

    const handleRefresh = useCallback(() => {
        if (selectedTeamId) {
            dispatch(fetchTeamMembers(selectedTeamId, (err, team) => {
                if(team) {
                    const { uniqueIds} =  getTeamUserIds(team[0], user_id);
                    dispatch(fetchTeamStreams(uniqueIds));
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
            if(data?.length) {
                handleTeamChange(data[0].id)
            }
        }));
    },[dispatch, handleTeamChange])

    if(!isTeamsFetching && !teamStreamData) {
        return <Container>
            <Alert variant="danger" className="mt-3">
                You do not appear to be a member of any teams.
            </Alert>
        </Container>
    }

    return <Container>
        {teamsLastError && (
            <Alert variant="danger" className="mt-3">
                {teamsLastError.error_description || teamsLastError.error || teamsLastError}
            </Alert>
        )}
        <div className="display-opts">
            <label>Your Teams</label>
        </div>

        {!isTeamsFetching && teamStreamData ? (
            <>
                <Nav activeKey={selectedTeamId} className="flex-column event-list mb-3" onSelect={handleTeamChange}>
                    {!teamsData?.length ? (
                        <Nav.Item className="static"><Alert variant="warning" className="mt-3">You do not appear to be a member of any teams :(</Alert></Nav.Item>
                    ) : (
                        <NavDropdown placement="bottom" menuVariant="dark" title={<span>{selectedTeam?.team_display_name || 'Select twitch team...'}</span>}>
                            {teamsData.map((team, i) => {
                                return (
                                    <NavDropdown.Item key={i} eventKey={team.id}>
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
                {!teamStreamData?.length && !isStreamsFetching ? (
                    <div className="no-team-members-live">
                        <img src={sadLogo} className="" alt="logo" />
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
                {teamsLastError.error_description || teamsLastError.error || teamsLastError}
            </Alert>
        )}

    </Container>
}