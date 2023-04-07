import Loading from "../common/Loading";
import {useDispatch, useSelector} from "react-redux";
import {useCallback, useEffect, useState} from "react";
import {fetchFollowedStreams, fetchRaidStart, fetchRaidStop} from "./StreamActions";
import {Alert, Badge, Button, Col, Container, Form, Modal, Navbar, NavDropdown, Row} from "react-bootstrap";
import './StreamList.scss';
import {CondensedFormatter} from "../common/PrettyNumber";
import twitchLogo from '../TwitchGlitchPurple.svg';
import {TimeDuration} from "./TimeDuration";
import {SORT_BY, SORT_DIRECTION, SortableField} from "./SortableField";
import {revokeToken} from "../session/SessionActions";
import Moment from "moment";
import profileImage from '../profile.svg';
import {setPreference} from "../app/AppActions";
import {Countdown} from "./Countdown";

const REFRESH_INTERVAL = 15000;

/**
 *  Stream list view (the main screen of the app)
 * @return {JSX.Element}
 * @constructor
 */
function StreamList() {
    const dispatch = useDispatch();

    // todo - consider persisting local preference state to the app state
    const [sortBy, setSortBy] = useState(SORT_BY.VIEWER_COUNT); // default api sort
    const [sortDir, setSortDir] = useState(SORT_DIRECTION.DESC);
    const { showTitles, showTags, showProfileImg } = useSelector(state => state.app.preferences);
    // const [showTitles, setShowTitles] = useState(true);
    // const [showTags, setShowTags] = useState(true);
    // const [showProfileImg, setShowProfileImg] = useState(true);
    const [selectedStreamId, setSelectedStream] = useState(null);
    const [showModal, setShowModal] = useState(null);

    const streams = useSelector(state => state.streams);
    const { user_id, login } = useSelector(state => state.session.data);
    const userCache = useSelector(state => state.users.cache);

    const { isFetching, lastError, data, raid, lastUpdated } = streams;
    const { isFetching: isRaidFetching, /*isCancelled, lastError: raidLastError,*/ lastUpdated: raidStartedAt } = raid;

    // Check if a raid is currently active, based on api response and time executed
    let isRaiding = false;
    if (raidStartedAt) {
        // raids last up to 90 seconds from execute, but can be executed faster in the Twitch UX
        // we'll at least block a second raid attempt until 90s after launch
        isRaiding = Moment(raidStartedAt).add(90, 'seconds').isAfter(Moment());
    }

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
        setSelectedStream(id);
        setShowModal(true);
    }, [setSelectedStream, setShowModal]);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
    }, [setShowModal]);

    const handleSignOut = useCallback(() => {
        dispatch(revokeToken());
    }, [dispatch]);

    // Storing the stream id because, if the streams list refreshes and the id is gone, the streamer went offline
    // Would be a total shame if someone popped the modal open and suddenly the streamer went offline while they were finishing up
    const selectedStream = selectedStreamId ? data.find(stream => stream.id === selectedStreamId) : null;

    const handleRaidStart = useCallback(() => {
        // console.log('DO THE RAID', selectedStream.user_id);
        dispatch(fetchRaidStart(selectedStream.user_id));
    }, [dispatch, selectedStream]);

    const handleRaidStop = useCallback(() => {
        dispatch(fetchRaidStop());
    }, [dispatch]);

    // Show a spinner on until stream list is loaded
    if (!data) return <Loading />;

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
            <Navbar sticky="top" bg="dark" variant="dark">
                <Container>
                    <Navbar.Brand>DirtyRaid™</Navbar.Brand>
                    <Navbar.Toggle />
                    <Navbar.Collapse className="justify-content-end">
                        <NavDropdown title={<><img src={userCache[user_id]?.profile_image_url || twitchLogo} alt="" /> {userCache[user_id]?.display_name || login}</>} id="user-dropdown" align="end">
                            <NavDropdown.Item onClick={handleSignOut}>Sign out</NavDropdown.Item>
                        </NavDropdown>
                        <Navbar.Text>

                        </Navbar.Text>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
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
                            <div className="stream" key={i} data-id={stream.id} onClick={handleStreamClick}>
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
            </div>
                <Modal show={showModal} onHide={handleCloseModal} size="lg" centered className="stream-modal">
                    <Modal.Header closeButton>
                        <Modal.Title id="stuffs">
                            {userCache[selectedStream?.user_id] && userCache[selectedStream?.user_id].broadcaster_type === 'partner' &&
                                <i className="bi bi-patch-check-fill partner"/>}
                            {selectedStream?.user_name || 'Streamer Offline!'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedStream ? (
                            <>
                                <Row>
                                    <Col>
                                        <img src={selectedStream.thumbnail_url.replace(/{width}x{height}/, '400x225')+'?nonce='+lastUpdated} alt="" />
                                    </Col>
                                </Row>
                                <Row>
                                    <Col className="title">{selectedStream.title}</Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <div className="flex-grow-0 participation">
                                    <span className="viewers"><i className="bi bi-eye-fill"/> {
                                        CondensedFormatter(selectedStream.viewer_count, 0)}
                                    </span>
                                            <TimeDuration time={selectedStream.started_at} />
                                        </div>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col className="tags">
                                        <Badge bg="game">{selectedStream.game_name}</Badge>
                                        {selectedStream.is_mature && <Badge bg="warning">Mature</Badge>}
                                        {(selectedStream.tags||[]).sort((a, b) => a.localeCompare(b)).map((tag, i) => (
                                            <Badge bg="tag" key={i}>{tag}</Badge>
                                        ))}
                                    </Col>
                                </Row>
                            </>
                        ) : (
                            <Row>
                                <Col>
                                    <Alert variant="danger">
                                        The streamer you selected no longer appears to be online!
                                    </Alert>
                                </Col>
                            </Row>
                        )}

                    </Modal.Body>
                    <Modal.Footer>
                        {selectedStream && (
                            isRaiding ? (
                                <Button disabled={isRaidFetching} variant="warning" onClick={handleRaidStop}>Cancel Raid</Button>
                            ) : (
                                <Button disabled={isRaidFetching} variant="danger" onClick={handleRaidStart}>Raid Now</Button>
                            )
                        )}
                        <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </div>
    );
}

export default StreamList;