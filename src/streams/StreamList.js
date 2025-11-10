import {useDispatch, useSelector} from "react-redux";
import {useCallback, useEffect, useState} from "react";
import {fetchFollowedStreams} from "./StreamActions";
import {Container, Nav, Navbar, NavDropdown, Tab} from "react-bootstrap";
import './StreamList.scss';
import twitchLogo from '../TwitchGlitchPurple.svg';
import {revokeToken} from "../session/SessionActions";
import RaidPalView, {getLineupUserLogins} from "../raidpal/RaidPalView";
import TeamsView from "../teams/TeamsView";
import FollowersView from "../followers/FollowersView";
import {fetchUsersTeams} from "../teams/TeamsActions";
import Dropzone from "../common/Dropzone";
import {fetchCustomStreamsByLogin, setCustomEventData} from "../raidpal/RaidPalActions";
import RaidPalCustomView from "../raidpal/RaidPalCustomView";
import {fetchUsers} from "../users/UserActions";
import CustomEventModal from "./CustomEventModal";
import QRCodeModal from "../qr-modal/QRCodeModal";
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
    const { events: customEvents, selectedEventKey } = useSelector(state => state.custom);
    const [ currentTab, setCurrentTab ] = useState('followed');
    const [ showCustomEventModal, setShowCustomEventModal ] = useState(false);
    const [ showQRCodeModal, setShowQRCodeModal ] = useState(false);

    const handleTabChange = useCallback((eventKey) => {
        setCurrentTab(eventKey);
    }, []);

    const handleShowModal = useCallback((e) => {
        e && e.preventDefault();
        e && e.stopPropagation();

        setShowCustomEventModal(true);
    }, []);

    const handleShowQRModal = useCallback((e) => {
        e && e.preventDefault();
        e && e.stopPropagation();

        setShowQRCodeModal(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setShowCustomEventModal(false);
    }, []);

    const handleCloseQRModal = useCallback(() => {
        setShowQRCodeModal(false);
    }, []);

    // When the last custom event is removed, if on the Custom tab, switch back to Followed
    useEffect(() => {
        if (currentTab === 'custom' && customEvents.length === 0) {
            setCurrentTab('followed');
        }
    }, [currentTab, customEvents.length]);

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

    // When a custom event exists (persisted or newly loaded), ensure we fetch related users and streams
    const selectedCustomEvent = customEvents.find(e => e.key === selectedEventKey)?.data || null;

    useEffect(() => {
        if (!selectedCustomEvent || !selectedCustomEvent.event) return;

        const userLogins = Array.from(new Set(
            selectedCustomEvent.event.time_table
                .map(entry => (entry && typeof entry.broadcaster_display_name === 'string') ? entry.broadcaster_display_name.toLowerCase().trim() : '')
        )).filter(login => !!login);

        if (userLogins.length) {
            dispatch(fetchUsers(userLogins));
            const { uniqueLogins } = getLineupUserLogins(selectedCustomEvent.event, login);
            dispatch(fetchCustomStreamsByLogin(uniqueLogins));
        }
    }, [dispatch, selectedCustomEvent, login]);

    const handleSignOut = useCallback(() => {
        dispatch(revokeToken());
    }, [dispatch]);

    const loadData = useCallback((data) => {
        // Check that it appears to have all the proper bits
        if (!data ||
            !data.event ||
            !data.event.title ||
            !data.event.slot_duration_mins ||
            !data.event.starttime ||
            !data.event.time_table ||
            !data.event.time_table.length
        ) {
            console.error('This does not look like a valid event', data);
            return;
        }

        // Seems ok - timetable might be botched though
        dispatch(setCustomEventData(data));
        console.log('loading event data', data)

        // Queue user fetches
        const userLogins = Array.from(new Set(
            data.event.time_table
                .map(entry => (entry && typeof entry.broadcaster_display_name === 'string') ? entry.broadcaster_display_name.toLowerCase().trim() : '')
        )).filter(login => !!login);

        dispatch(fetchUsers(userLogins));

        const {uniqueLogins} = getLineupUserLogins(data.event, login);
        dispatch(fetchCustomStreamsByLogin(uniqueLogins));

        setCurrentTab('custom');
    }, [dispatch, login])

    const onCustomEventLoaded = useCallback((data) => {
        loadData(data);
        setShowCustomEventModal(false);
    }, [loadData]);

    const handleFileDrop = useCallback(async (file) => {
        try {
            const raw = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve(e.target.result);
                };
                reader.onerror = (err) => {
                    reject(err);
                }

                reader.readAsText(file);
            });

            const data = JSON.parse(raw);

            loadData(data);

        } catch (e) {
            console.error('Failed to parse file', e);
        }
    }, [loadData]);

    return (
        <Dropzone onFile={handleFileDrop}>
            <div className="Streams">
                <Tab.Container id="stream-tabs" activeKey={currentTab} onSelect={handleTabChange}>
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
                                {customEvents.length > 0 && (
                                    <Nav.Item>
                                        <Nav.Link eventKey="custom">Custom</Nav.Link>
                                    </Nav.Item>
                                )}
                            </Nav>
                            <Navbar.Toggle />
                            <Navbar.Collapse className="justify-content-end">
                                <NavDropdown title={<><img src={userCache[user_id]?.profile_image_url || twitchLogo} alt="" /> {userCache[user_id]?.display_name || login}</>} id="user-dropdown" align="end">
                                    <NavDropdown.Item onClick={handleShowQRModal}>My Channel</NavDropdown.Item>
                                    <NavDropdown.Item onClick={handleShowModal}>Custom Event</NavDropdown.Item>
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={handleSignOut}>Sign out</NavDropdown.Item>
                                </NavDropdown>
                            </Navbar.Collapse>
                        </Container>
                    </div>
                    <Tab.Content>
                        <Tab.Pane eventKey="followed">
                            <FollowersView />
                        </Tab.Pane>
                        <Tab.Pane eventKey="teams">
                            <TeamsView />
                        </Tab.Pane>
                        <Tab.Pane eventKey="raidpal">
                            <RaidPalView />
                        </Tab.Pane>
                        {customEvents.length > 0 && (
                            <Tab.Pane eventKey="custom">
                                <RaidPalCustomView />
                            </Tab.Pane>
                        )}
                    </Tab.Content>
                </Tab.Container>
                <CustomEventModal showModal={showCustomEventModal} handleCloseModal={handleCloseModal} onCustomEventLoaded={onCustomEventLoaded} />
                <QRCodeModal showModal={showQRCodeModal} handleCloseModal={handleCloseQRModal} />
            </div>
        </Dropzone>
    );
}

export default StreamList;
