import {Alert, Badge, Button, Col, Form, Row} from "react-bootstrap";
import {useDispatch, useSelector} from "react-redux";
import {useCallback, useState} from "react";
import {SORT_BY, SORT_DIRECTION, SortableField} from "./SortableField";
import {setPreference} from "../app/AppActions";
import {Countdown} from "./Countdown";
import profileImage from "../profile.svg";
import {CondensedFormatter} from "../common/PrettyNumber";
import {TimeDuration} from "./TimeDuration";
import StreamInfoModal from "./StreamInfoModal";
import {REFRESH_INTERVAL} from "./StreamList";

function ReUsableStreamList({streams, lastUpdated, isFetching, handleRefresh}) {

    const dispatch = useDispatch();

    const [sortBy, setSortBy] = useState(SORT_BY.VIEWER_COUNT); // default api sort
    const [sortDir, setSortDir] = useState(SORT_DIRECTION.DESC);
    const [selectedStreamId, setSelectedStream] = useState(null);
    const [selectedStreamUserId, setSelectedStreamUserId] = useState(null);
    const [showModal, setShowModal] = useState(null);

    const {showTitles, showTags, showProfileImg} = useSelector(state => state.app.preferences);
    const userCache = useSelector(state => state.users.cache);

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

    const handleStreamClick = useCallback((e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const userId = e.currentTarget.getAttribute('data-user-id');
        setSelectedStream(id);
        setSelectedStreamUserId(userId);
        setShowModal(true);
    }, [setSelectedStream, setSelectedStreamUserId, setShowModal]);

    const handleFeelingLucky = useCallback(() => {
        if (streams?.length) {
            const randomStream = streams[Math.floor(Math.random()*streams.length)];
            setSelectedStream(randomStream.id);
            setSelectedStreamUserId(randomStream.user_id);
            setShowModal(true);
        }
    }, [setSelectedStream, setSelectedStreamUserId, setShowModal, streams])

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
    }, [setShowModal]);

    // Storing the stream id because, if the streams list refreshes and the id is gone, the streamer went offline
    // Would be a total shame if someone popped the modal open and suddenly the streamer went offline while they were finishing up
    // Also has a fallback userId to update the selectedStream, e.g. go-live or stream crash
    const selectedStream = (selectedStreamId && streams.find(stream => stream.id === selectedStreamId)) ||
        (selectedStreamUserId && streams.find(stream => stream.user_id === selectedStreamUserId)) || null;

    const streamList = [].concat(streams).sort((a, b) => {

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

    return <>
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
                Boolean(streams?.length) && streamList.map((stream, i) => {
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
            {
                streams?.length > 2 ? (
                    <div className="stream" onClick={handleFeelingLucky}>
                        <div className="info-container">
                            {showProfileImg && (
                                <div className="profile-container">
                                    <img src={'/roulette.jpg'} alt="" />
                                </div>
                            )}
                            <div className="stream-info">
                                <Row className="whodis">
                                    <Col>
                                        <div className="d-flex justify-content-between">
                                            <div className="flex-grow-1 user-name"><span>Raid Roulette</span></div>
                                            <div className="flex-grow-0 participation">

                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                                {showTitles && (
                                    <Row>
                                        <Col className="title">Select a channel at random.</Col>
                                    </Row>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null
            }
            {!streamList.length && (
                <div className="no-streams">
                    <Alert variant="warning">That's weird, none of your followed channels are online :(</Alert>
                </div>
            )}
        </div>
        <StreamInfoModal selectedStream={selectedStream} selectedUserId={selectedStreamUserId} lastUpdated={lastUpdated} handleCloseModal={handleCloseModal} showModal={showModal} />

    </>
}

export default ReUsableStreamList