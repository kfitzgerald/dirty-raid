import {useDispatch, useSelector} from "react-redux";
import {useCallback, useEffect} from "react";
import {fetchFollowedStreams} from "./StreamActions";
import {Container, Nav, Navbar, NavDropdown, Tab} from "react-bootstrap";
import './StreamList.scss';
import twitchLogo from '../TwitchGlitchPurple.svg';
import {revokeToken} from "../session/SessionActions";
import RaidPalView from "../raidpal/RaidPalView";
import TeamsView from "../teams/TeamsView";
import FollowersView from "../followers/FollowersView";
import {fetchUsersTeams} from "../teams/TeamsActions";
export const REFRESH_INTERVAL = 15000;

/**
 *  Stream list view (the main screen of the app)
 * @return {JSX.Element}
 * @constructor
 */
function StreamList() {
    const dispatch = useDispatch();

    const { user_id, login } = useSelector(state => state.session.data);
    const userCache = useSelector(state => state.users.cache);
    const { isFetching: isTeamsFetching, data: teamsData } = useSelector(state => state.teams);


    useEffect(() => {
        // Fetch on load
        dispatch(fetchFollowedStreams());
        dispatch(fetchUsersTeams());
        // Refresh every 15s
        const refreshInterval = setInterval(() => {
            dispatch(fetchFollowedStreams());
        }, REFRESH_INTERVAL);

        // Cleanup
        return () => {
            clearInterval(refreshInterval);
        };
    }, [dispatch]);

    const handleSignOut = useCallback(() => {
        dispatch(revokeToken());
    }, [dispatch]);

    return (
        <div className="Streams">
            <Tab.Container id="stream-tabs" defaultActiveKey="followed">
                <div className="navbar navbar-expand navbar-dark bg-dark sticky-top">
                    <Container>
                        <Nav className="me-auto" navbar={true} bsPrefix="navbar-nav">
                            <Nav.Item>
                                <Nav.Link eventKey="followed">Followed</Nav.Link>
                            </Nav.Item>
                            {!isTeamsFetching && teamsData ? (
                                <Nav.Item>
                                    <Nav.Link eventKey="teams">Teams</Nav.Link>
                                </Nav.Item>
                            ) : null}
                            <Nav.Item>
                                <Nav.Link eventKey="raidpal">RaidPal</Nav.Link>
                            </Nav.Item>
                        </Nav>
                        <Navbar.Toggle />
                        <Navbar.Collapse className="justify-content-end">
                            <NavDropdown title={<><img src={userCache[user_id]?.profile_image_url || twitchLogo} alt="" /> {userCache[user_id]?.display_name || login}</>} id="user-dropdown" align="end">
                                <NavDropdown.Item onClick={handleSignOut}>Sign out</NavDropdown.Item>
                            </NavDropdown>
                        </Navbar.Collapse>
                    </Container>
                </div>
                <Tab.Content>
                    <Tab.Pane eventKey="followed">
                        <FollowersView />
                    </Tab.Pane>
                    <Tab.Pane eventKey="raidpal">
                        <RaidPalView />
                    </Tab.Pane>
                    <Tab.Pane eventKey="teams">
                        <TeamsView />
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </div>
    );
}

export default StreamList;