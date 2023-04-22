import Loading from "../common/Loading";
import {useDispatch, useSelector} from "react-redux";
import {useCallback, useEffect, useState} from "react";
import {fetchFollowedStreams} from "./StreamActions";
import {Alert, Badge, Button, Col, Container, Form, Nav, Navbar, NavDropdown, Row, Tab} from "react-bootstrap";
import './StreamList.scss';
import {CondensedFormatter} from "../common/PrettyNumber";
import twitchLogo from '../TwitchGlitchPurple.svg';
import {TimeDuration} from "./TimeDuration";
import {SORT_BY, SORT_DIRECTION, SortableField} from "./SortableField";
import {revokeToken} from "../session/SessionActions";
import profileImage from '../profile.svg';
import {setPreference} from "../app/AppActions";
import {Countdown} from "./Countdown";
import RaidPalView from "../raidpal/RaidPalView";
import TeamsView from "../teams/TeamsView";
import StreamInfoModal from "./StreamInfoModal";

export const REFRESH_INTERVAL = 15000;

/**
 *  Stream list view (the main screen of the app)
 * @return {JSX.Element}
 * @constructor
 */
function StreamList() {
    const dispatch = useDispatch();

    const [sortBy, setSortBy] = useState(SORT_BY.VIEWER_COUNT); // default api sort
    const [sortDir, setSortDir] = useState(SORT_DIRECTION.DESC);
    const [selectedStreamId, setSelectedStream] = useState(null);
    const [selectedStreamUserId, setSelectedStreamUserId] = useState(null);
    const [showModal, setShowModal] = useState(null);

    const {showTitles, showTags, showProfileImg} = useSelector(state => state.app.preferences);
    const streams = useSelector(state => state.streams);
    const { user_id, login } = useSelector(state => state.session.data);
    const userCache = useSelector(state => state.users.cache);
    const { isFetching: isTeamsFetching, data: teamsData } = useSelector(state => state.teams);


    const { isFetching, lastError, data, lastUpdated } = streams;


    useEffect(() => {
        // Fetch on load
        dispatch(fetchFollowedStreams());

        // Refresh every 15s
        const refreshInterval = setInterval(() => {
            dispatch(fetchFollowedStreams());
        }, REFRESH_INTERVAL);

        // Cleanup
        return () => {
            clearInterval(refreshInterval);
        };
    }, [dispatch]);

    const handleSort = useCallback((by, dir) => {
        setSortBy(by);
        setSortDir(dir);
    }, [setSortBy, setSortDir]);

    const handleToggleTitle = useCallback((e) => {
        dispatch(setPreference('showTitles', e.target.checked));
    }, [dispatch]);

    const handleToggleTags = useCallback((e) => {
        dispatch(setPreference('showTags', e.target.checked));
    }, [dispatch]);

    const handleToggleProfileImg = useCallback((e) => {
        dispatch(setPreference('showProfileImg', e.target.checked));
    }, [dispatch]);

    const handleRefresh = useCallback(() => {
        dispatch(fetchFollowedStreams());
    }, [dispatch]);

    const handleStreamClick = useCallback((e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const userId = e.currentTarget.getAttribute('data-user-id');
        setSelectedStream(id);
        setSelectedStreamUserId(userId);
        setShowModal(true);
    }, [setSelectedStream, setSelectedStreamUserId, setShowModal]);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
    }, [setShowModal]);

    const handleSignOut = useCallback(() => {
        dispatch(revokeToken());
    }, [dispatch]);

    // Storing the stream id because, if the streams list refreshes and the id is gone, the streamer went offline
    // Would be a total shame if someone popped the modal open and suddenly the streamer went offline while they were finishing up
    // Also has a fallback userId to update the selectedStream, e.g. go-live or stream crash
    const selectedStream = (selectedStreamId && data.find(stream => stream.id === selectedStreamId)) ||
        (selectedStreamUserId && data.find(stream => stream.user_id === selectedStreamUserId)) || null;

    // Show a spinner on until stream list is loaded
    if (!data) return <Loading>
        {lastError && <Alert variant="danger">
            {lastError.error_description || lastError.error || lastError}
        </Alert>}
    </Loading>;

    // Copy the stream list and sort based on current  preference
    const streamList = [].concat(data).sort((a, b) => {

        // Pull values being sorted on
        let v1 = a[sortBy];
        let v2 = b[sortBy];

        // Invert the values if sorting backwards
        if (sortDir === SORT_DIRECTION.DESC) {
            v1 = b[sortBy];
            v2 = a[sortBy];
        }

        // Handle the sort
        switch (sortBy) {

            case SORT_BY.VIEWER_COUNT:
                return v1-v2;

            case SORT_BY.IS_MATURE:
                return (v1 ? 1 : 0) - (v2 ? 1 : 0);

            case SORT_BY.STARTED_AT:
                return v2.localeCompare(v1);

            case SORT_BY.USER_NAME:
            case SORT_BY.GAME_NAME:
            case SORT_BY.TITLE:
            default:
                return v1.localeCompare(v2);
        }
    });

    return (
        <div className="Streams">
            <Tab.Container id="stream-tabs" defaultActiveKey="followed">
                <div className="navbar navbar-expand navbar-dark bg-dark sticky-top">
                    <Container>
                        <Nav className="me-auto" navbar={true} bsPrefix="navbar-nav">
                            <Nav.Item>
                                <Nav.Link eventKey="followed">Followed</Nav.Link>
                            </Nav.Item>
                            {
                                !isTeamsFetching && teamsData?.length && (
                                    <Nav.Item>
                                        <Nav.Link eventKey="teams">Teams</Nav.Link>
                                    </Nav.Item>
                                )
                            }
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
                        <Container>
                            {lastError && (
                                <Alert variant="danger">
                                    {lastError.error_description || lastError.error || lastError}
                                </Alert>
                            )}
                            <div className="display-opts">
                                <div className="opt-labels">
                                    <label>Display Options:</label>
                                    <label>Refreshes in <code><Countdown to={(lastUpdated||Date.now()) + REFRESH_INTERVAL} /></code>...</label>
                                </div>
                                <div>
                                    <div>
                                        <Form.Check type="switch" id="show-title" label="Titles" checked={showTitles} onChange={handleToggleTitle} />
                                    </div>
                                    <div>
                                        <Form.Check type="switch" id="show-tags" label="Tags" checked={showTags} onChange={handleToggleTags} />
                                    </div>
                                    <div>
                                        <Form.Check type="switch" id="show-tags" label="Pic" checked={showProfileImg} onChange={handleToggleProfileImg} />
                                    </div>
                                    <div className="refresh text-end flex-grow-1">
                                        <Button disabled={isFetching} onClick={handleRefresh}><i className="bi bi-arrow-clockwise"/></Button>
                                    </div>
                                </div>
                            </div>
                            <div className="stream-sort">
                                <label>Sort by:</label>
                                <SortableField field={SORT_BY.USER_NAME} sortBy={sortBy} sortDir={sortDir} onChange={handleSort}>Name</SortableField>
                                <SortableField field={SORT_BY.GAME_NAME} sortBy={sortBy} sortDir={sortDir} onChange={handleSort}>Category</SortableField>
                                <SortableField field={SORT_BY.TITLE} sortBy={sortBy} sortDir={sortDir} onChange={handleSort}>Title</SortableField>
                                <SortableField field={SORT_BY.IS_MATURE} sortBy={sortBy} sortDir={sortDir} onChange={handleSort}>Mature</SortableField>
                                <SortableField field={SORT_BY.VIEWER_COUNT} sortBy={sortBy} sortDir={sortDir} onChange={handleSort}>Viewers</SortableField>
                                <SortableField field={SORT_BY.STARTED_AT} sortBy={sortBy} sortDir={sortDir} onChange={handleSort}>Uptime</SortableField>
                            </div>
                            <div className="stream-list">
                                {
                                    streamList.map((stream, i) => {
                                        const profile = userCache[stream.user_id];
                                        return (
                                            <div className="stream" key={i} data-id={stream.id} data-user-id={stream.user_id} onClick={handleStreamClick}>
                                                <div className="info-container">
                                                    {showProfileImg && (
                                                        <div className="profile-container">
                                                            <img src={profile?.profile_image_url || profileImage} alt="" />
                                                        </div>
                                                    )}
                                                    <div className="stream-info">
                                                        <Row className="whodis">
                                                            <Col>
                                                                <div className="d-flex justify-content-between">
                                                                    <div className="flex-grow-1 user-name"><span>{profile && profile.broadcaster_type === 'partner' &&
                                                                        <i className="bi bi-patch-check-fill partner"/>}{stream.user_name}</span></div>
                                                                    <div className="flex-grow-0 participation">
                                                                        <span className="viewers"><i className="bi bi-eye-fill"/> {
                                                                            CondensedFormatter(stream.viewer_count, 0)}</span>
                                                                        <TimeDuration time={stream.started_at} />
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                        {showTitles && (
                                                            <Row>
                                                                <Col className="title">{stream.title}</Col>
                                                            </Row>
                                                        )}
                                                    </div>
                                                </div>
                                                {showTags && (
                                                    <Row>
                                                        <Col className="tags">
                                                            <Badge bg="game">{stream.game_name}</Badge>
                                                            {stream.is_mature && <Badge bg="warning">Mature</Badge>}
                                                            {(stream.tags||[]).sort((a, b) => a.localeCompare(b)).map((tag, i) => (
                                                                <Badge bg="tag" key={i}>{tag}</Badge>
                                                            ))}
                                                        </Col>
                                                    </Row>
                                                )}


                                            </div>
                                        );
                                    })
                                }
                                {!streamList.length && (
                                    <div className="no-streams">
                                        <Alert variant="warning">That's weird, none of your followed channels are online :(</Alert>
                                    </div>
                                )}
                            </div>
                            <StreamInfoModal selectedStream={selectedStream} selectedUserId={selectedStreamUserId} lastUpdated={lastUpdated} handleCloseModal={handleCloseModal} showModal={showModal} />
                        </Container>
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