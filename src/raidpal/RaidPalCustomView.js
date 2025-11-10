import {Alert, Badge, Button, Container, Form, Nav, NavDropdown} from "react-bootstrap";
import {useDispatch, useSelector} from "react-redux";
import {useCallback, useEffect, useState} from "react";
import {
    fetchCustomStreamsByLogin,
} from "./RaidPalActions";
import './RaidPalView.scss';
import Moment from "moment";
import profileImage from "../profile.svg";
import ShowMoreText from "react-show-more-text";
import {Countdown} from "../streams/Countdown";
import {REFRESH_INTERVAL} from "../streams/StreamList";
import {setPreference} from "../app/AppActions";
import StreamInfoModal from "../streams/StreamInfoModal";
import {CondensedFormatter} from "../common/PrettyNumber";
import ErrorMessage from "../common/ErrorMessage";
import {getCondensedTimeTableByName, getLineupUserLogins} from "./RaidPalView";
import {removeCustomEvent, selectCustomEvent} from "./RaidPalActions";

export default function RaidPalCustomView() {
    const dispatch = useDispatch();

    const [showModal, setShowModal] = useState(null);
    const [selectedStreamId, setSelectedStream] = useState(null);
    const [selectedStreamUserLogin, setSelectedStreamUserLogin] = useState(null);

    const { showAmPm } = useSelector(state => state.app.preferences);
    const { lastError, customEventStreams: streams, events: customEvents, selectedEventKey } = useSelector(state => state.custom);
    const { login } = useSelector(state => state.session.data);
    const userCache = useSelector(state => state.users.cache);

    const { isFetching: isStreamStatusFetching, lastError: streamLastError, lastUpdated: streamsLastUpdated } = streams;

    const now = Moment.utc();
    const selectedEvent = (customEvents.find(e => e.key === selectedEventKey)?.data?.event) || null;

    const handleEventChange = useCallback((eventKey) => {
        dispatch(selectCustomEvent(eventKey));
    }, [dispatch]);

    const handleRemoveEvent = useCallback((e, key) => {
        e && e.preventDefault();
        e && e.stopPropagation();
        dispatch(removeCustomEvent(key));
    }, [dispatch]);

    const handleRefresh = useCallback(() => {
        if (selectedEvent) {
            const {uniqueLogins} = getLineupUserLogins(selectedEvent, login);
            dispatch(fetchCustomStreamsByLogin(uniqueLogins));
        }
    }, [dispatch, selectedEvent, login]);

    const handleStreamClick = useCallback((e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const userLogin = e.currentTarget.getAttribute('data-user-login');
        setSelectedStream(id);
        setSelectedStreamUserLogin(userLogin);
        setShowModal(true);
    }, [setSelectedStream, setSelectedStreamUserLogin, setShowModal]);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
    }, [setShowModal]);

    // Refresh stream info every 15 sec
    useEffect(() => {
        const streamRefreshInterval = setInterval(() => {
            handleRefresh();
        }, REFRESH_INTERVAL);

        // Cleanup
        return () => {
            clearInterval(streamRefreshInterval);
        };
    }, [dispatch, handleRefresh]);

    const selectedStream = (selectedStreamId && streams.data?.find(stream => stream.id === selectedStreamId)) ||
        (selectedStreamUserLogin && streams.data?.find(stream => stream.user_login === selectedStreamUserLogin)) || null;

    const handleToggleAmPm = useCallback((e) => {
        dispatch(setPreference('showAmPm', e.target.checked));
    }, [dispatch]);

    

    return (
        <Container>
            {lastError && (
                <Alert variant="danger" className="mt-3">
                    <ErrorMessage error={lastError} />
                </Alert>
            )}
            <div className="display-opts fle">
                <div className="opt-labels">
                    <label>Custom Events</label>
                </div>
            </div>
            <Nav activeKey={selectedEventKey} className="flex-column event-list mb-3" onSelect={handleEventChange}>
                {!customEvents?.length ? (
                    <Nav.Item className="static"><Alert variant="warning" className="mt-3">No custom events loaded</Alert></Nav.Item>
                ) : (
                    <NavDropdown placement="bottom" menuVariant="dark" title={<span>{selectedEvent?.title || (selectedEventKey && customEvents.find(e => e.key === selectedEventKey)?.data?.event?.title) || 'Select custom event...'}</span>}>
                        {customEvents.map(({ key, data }, i) => {
                            return (
                                <NavDropdown.Item key={key} eventKey={key}>
                                    <span className="title">{data.event.title}</span>
                                    <Button size="sm" variant="link" className="p-0 ms-2 text-danger float-end" title="Remove" onClick={(e) => handleRemoveEvent(e, key)}>
                                        <i className="bi bi-x-circle"/>
                                    </Button>
                                </NavDropdown.Item>
                            );
                        })}
                    </NavDropdown>
                )}
            </Nav>

            {streamLastError && (
                <Alert variant="danger" className="mt-3">
                    <ErrorMessage error={streamLastError} />
                </Alert>
            )}
            {selectedEvent && (
                <div className="event">
                    <h2><span>{selectedEvent.title}</span></h2>
                    <ShowMoreText lines={3} className="description mb-3">
                        {selectedEvent.description}
                    </ShowMoreText>
                    <div className="display-opts">
                        <div className="opt-labels">
                            <label>Display Options:</label>
                            <label>Refreshes in <code><Countdown to={(streamsLastUpdated||Date.now()) + REFRESH_INTERVAL} /></code>...</label>
                        </div>
                        <div>
                            <div>
                                <Form.Check type="switch" id="show-ampm" label="AM/PM" checked={showAmPm} onChange={handleToggleAmPm} />
                            </div>
                            <div className="refresh text-end flex-grow-1">
                                <Button disabled={isStreamStatusFetching} onClick={handleRefresh}><i className="bi bi-arrow-clockwise"/></Button>
                            </div>
                        </div>
                    </div>
                    <div className="lineup">
                        {getCondensedTimeTableByName(selectedEvent).map((slot, i) => {
                            const slotLoginName = (typeof slot.broadcaster_display_name === 'string') ? slot.broadcaster_display_name.toLowerCase() : '';
                            const isCurrent = now.isBetween(Moment.utc(slot.starttime), Moment.utc(slot.endtime));
                            const currentLiveStream = streams.data && streams.data.find(stream => stream.user_login === slotLoginName);
                            const profile = Object.values(userCache).find(u => u.login === slotLoginName);

                            let userBadge = null;
                            if (slotLoginName === login) {
                                userBadge = <><Badge bg="success">You</Badge></>;
                            } /*else if (slotLoginName) {
                                userBadge = <NotFollowingBadgeOfShame broadcaster_id={slot.broadcaster_id} />;
                            }*/

                            return (
                                <div className={"slot" + (isCurrent ? ' current' : '')} key={i} data-id={currentLiveStream?.id} data-user-login={slotLoginName} onClick={handleStreamClick}>
                                    <div className="profile-container">
                                        <img src={profile?.profile_image_url || profileImage} alt="" />
                                    </div>
                                    <div className="stream-info">
                                        <div className="user-name">
                                            {profile?.broadcaster_type === 'partner' && <i className="bi bi-patch-check-fill partner"/>}
                                            {slot.slot_occupied ? slot.broadcaster_display_name : <em>slot not occupied</em>}
                                        </div>
                                        <div className="timing">
                                            <span>{Moment(slot.starttime).format(showAmPm ? 'MMM Do, h:mma' : 'MMM Do, HH:mm')}</span>{' – '}
                                            <span>{Moment(slot.endtime).format(showAmPm ? 'h:mma' : 'HH:mm')}</span>
                                        </div>
                                    </div>
                                    <div className="stream-status">
                                            {userBadge}
                                            {currentLiveStream && <Badge bg="danger">
                                                <span className="viewers white">{ currentLiveStream.viewer_count > 1 ? <><i className="bi bi-eye-fill  "/> {
                                                    CondensedFormatter(currentLiveStream.viewer_count, 0)
                                                }</> : 'Live'}
                                        </span></Badge>}
                                    </div>
                                </div>
                            );
                        })}
                        <StreamInfoModal showModal={showModal} selectedStream={selectedStream} selectedUserLogin={selectedStreamUserLogin} handleCloseModal={handleCloseModal} lastUpdated={streamsLastUpdated} />
                    </div>
                </div>
            )}
        </Container>
    )
}
