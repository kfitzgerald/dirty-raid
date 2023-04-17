import {Alert, Badge, Button, Container, Form, Nav, NavDropdown} from "react-bootstrap";
import {useDispatch, useSelector} from "react-redux";
import {useCallback, useEffect, useState} from "react";
import {fetchRaidPalEvent, fetchRaidPalUser, fetchUserStreams, getSlug} from "./RaidPalActions";
import './RaidPalView.scss';
import Moment from "moment";
import {fetchUsers} from "../users/UserActions";
import profileImage from "../profile.svg";
import NotFollowingBadgeOfShame from "./NotFollowingBadgeOfShame";
import {fetchFollowedChannels} from "../followers/FollowerActions";
import ShowMoreText from "react-show-more-text";
import {Countdown} from "../streams/Countdown";
import {REFRESH_INTERVAL} from "../streams/StreamList";
import {setPreference} from "../app/AppActions";
import StreamInfoModal from "../streams/StreamInfoModal";

const RAIDPAL_REFRESH_INTERVAL = 900000; // 15 min

function getCondensedTimeTable(event) {
    const unique = [];
    const { time_table: slots, slot_duration_mins } = event;

    for(let endtime, i = 0; i < slots.length; i++) {
        endtime = Moment.utc(slots[i].starttime).add(slot_duration_mins, 'minutes').toISOString();
        if (i === 0) {
            unique.push(slots[i]);
            slots[i].endtime = endtime;
        } else {
            if (slots[i-1].broadcaster_id === slots[i].broadcaster_id) {
                // same streamer, update end time
                slots[i-1].endtime = endtime;
            } else {
                unique.push(slots[i]);
                slots[i].endtime = endtime;
            }
        }
    }
    return unique;
}

function getLineupUserIds(event, user_id) {
    // unique ids of folks on the lineup excluding ourselves and empty slots
    const ids = new Set(event.time_table
        .map(slot => slot.broadcaster_id)
        .filter(id => !!id)
    );

    const uniqueIds = Array.from(ids);
    const uniqueIdsExcludingSelf = uniqueIds.filter(id => id !== user_id);

    return { uniqueIds, uniqueIdsExcludingSelf };
}

export default function RaidPalView() {
    const dispatch = useDispatch();

    const [showModal, setShowModal] = useState(null);
    const [selectedStreamId, setSelectedStream] = useState(null);
    const [selectedStreamUserId, setSelectedStreamUserId] = useState(null);
    const [ selectedEventKey, setSelectedEventKey ] = useState(null);

    const { showAmPm } = useSelector(state => state.app.preferences);
    const { isFetching, lastError, /*lastUpdated,*/ data, events, streams } = useSelector(state => state.raidpal);
    const { user_id } = useSelector(state => state.session.data);
    const userCache = useSelector(state => state.users.cache);

    const { /*isFetching: isEventFetching,*/ lastError: eventLastError, cache } = events;
    const { isFetching: isStreamStatusFetching, lastError: streamLastError, lastUpdated: streamsLastUpdated } = streams;

    const now = Moment.utc();
    const selectedEvent = (selectedEventKey && cache[getSlug(selectedEventKey)]) || null;

    // Handle side effects when selecting an event
    const handleEventChange = useCallback((eventKey) => {
        setSelectedEventKey(eventKey);
        dispatch(fetchRaidPalEvent(eventKey, (err, event) => {
            if (event) {
                const { uniqueIds, uniqueIdsExcludingSelf} =  getLineupUserIds(event, user_id);

                // Fetch channel info
                dispatch(fetchUsers(uniqueIdsExcludingSelf));

                // Fetch follow status
                dispatch(fetchFollowedChannels(uniqueIdsExcludingSelf));

                // Fetch channel live status
                dispatch(fetchUserStreams(uniqueIds));
            }
        }));
    }, [dispatch, setSelectedEventKey, user_id]);

    // Fetch RaidPal info on mount
    useEffect(() => {
        // Fetch RP user event data
        dispatch(fetchRaidPalUser((err, data) => {
            // Preselect the best event
            if (data?.events_joined?.length) {

                // TODO: compare channel slot to now and choose the closest one, could be participating in multiple events
                // let liveEvents = data.events_joined
                //     .filter(e => now.isBetween(Moment.utc(e.starttime), Moment.utc(e.endtime)));
                // const defaultEvent = liveEvents[0] || data.events_joined[0];

                const eventKey = data.events_joined[0].api_link;
                handleEventChange(eventKey);
            }
        }));

        // Refresh RP every 15 min
        const rpRefreshInterval = setInterval(() => {
            dispatch(fetchRaidPalUser());
        }, RAIDPAL_REFRESH_INTERVAL);

        // Cleanup
        return () => {
            clearInterval(rpRefreshInterval);
        };
    }, [dispatch, setSelectedEventKey, handleEventChange]);

    const handleRefresh = useCallback(() => {
        if (selectedEvent) {
            const {uniqueIds} = getLineupUserIds(selectedEvent, user_id);
            dispatch(fetchUserStreams(uniqueIds));
        }
    }, [dispatch, selectedEvent, user_id]);

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

    const selectedStream = (selectedStreamId && streams.data.find(stream => stream.id === selectedStreamId)) ||
        (selectedStreamUserId && streams.data.find(stream => stream.user_id === selectedStreamUserId)) || null;

    const handleToggleAmPm = useCallback((e) => {
        dispatch(setPreference('showAmPm', e.target.checked));
    }, [dispatch]);

    return (
        <Container>
            {lastError && (
                <Alert variant="danger" className="mt-3">
                    {lastError.error_description || lastError.error || lastError}
                </Alert>
            )}
            <div className="display-opts">
                <label>Your Events</label>
            </div>
            {data ? (
                <Nav activeKey={selectedEventKey} className="flex-column event-list mb-3" onSelect={handleEventChange}>
                    {!data.events_joined?.length ? (
                        <Nav.Item className="static"><Alert variant="warning" className="mt-3">You don't have any upcoming events :(</Alert></Nav.Item>
                    ) : (
                        <NavDropdown placement="bottom" menuVariant="dark" title={<span>{selectedEvent?.title || (selectedEventKey && data.events_joined.find(e => e.api_link === selectedEventKey))?.title || 'Select RaidPal event...'}</span>}>
                            {data.events_joined.map((event, i) => {
                                const isLive = now.isBetween(Moment.utc(event.starttime), Moment.utc(event.endtime));
                                return (
                                    <NavDropdown.Item key={i} eventKey={event.api_link}>
                                        <span className="title">{event.title}</span>
                                        {isLive && <Badge bg="danger">Live</Badge>}
                                    </NavDropdown.Item>
                                );
                            })}
                        </NavDropdown>
                    )}
                </Nav>
            ) : ((!isFetching || lastError) ? (
                // Shown when the streamer has likely not joined RP
                <Alert variant="warning" className="mt-3">You don't have any upcoming events :(</Alert>
            ) : null) }
            {eventLastError && (
                <Alert variant="danger" className="mt-3">
                    {eventLastError.error_description || eventLastError.error || eventLastError}
                </Alert>
            )}
            {streamLastError && (
                <Alert variant="danger" className="mt-3">
                    {streamLastError.error_description || streamLastError.error || streamLastError}
                </Alert>
            )}
            {selectedEvent && (
                <div className="event">
                    <h2>{selectedEvent.title}</h2>
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
                        {getCondensedTimeTable(selectedEvent).map((slot, i) => {
                            const isCurrent = now.isBetween(Moment.utc(slot.starttime), Moment.utc(slot.endtime));
                            const currentLiveStream = streams.data && streams.data.find(stream => stream.user_id === slot.broadcaster_id);
                            const profile = userCache[slot.broadcaster_id];

                            let userBadge = null;
                            if (slot.broadcaster_id === user_id) {
                                userBadge = <><Badge bg="success">You</Badge><br /></>;
                            } else if (slot.broadcaster_id) {
                                userBadge = <NotFollowingBadgeOfShame broadcaster_id={slot.broadcaster_id} />;
                            }

                            return (
                                <div className={"slot" + (isCurrent ? ' current' : '')} key={i} data-id={currentLiveStream?.id} data-user-id={slot.broadcaster_id} onClick={handleStreamClick}>
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
                                        {currentLiveStream && <Badge bg="danger">Live</Badge>}
                                    </div>
                                </div>
                            );
                        })}
                        <StreamInfoModal showModal={showModal} selectedStream={selectedStream} selectedUserId={selectedStreamUserId} handleCloseModal={handleCloseModal} lastUpdated={streamsLastUpdated} />
                    </div>
                </div>
            )}
        </Container>
    )
}