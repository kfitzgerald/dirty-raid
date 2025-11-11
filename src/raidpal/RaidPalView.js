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
import {CondensedFormatter} from "../common/PrettyNumber";
import RaidPalLogo from "../raidpal-logo.svg";
import ErrorMessage from "../common/ErrorMessage";

export const RAIDPAL_REFRESH_INTERVAL = 900000; // 15 min

export function getCondensedTimeTable(event) {
    const unique = [];
    const { time_table: slots, slot_duration_mins } = event;

    for (let endtime, i = 0; i < slots.length; i++) {
        endtime = Moment.utc(slots[i].starttime).add(slot_duration_mins, 'minutes').toISOString();
        slots[i].endtime = endtime;

        if (i === 0) {
            // first slot - add as-is
            unique.push(slots[i]);
        } else {
            if (slots[i-1].broadcaster_id === slots[i].broadcaster_id) {
                // same streamer, update end time
                unique[unique.length-1].endtime = endtime;
            } else {
                // new streamer, add slot
                unique.push(slots[i]);
            }
        }
    }
    return unique;
}

export function getCondensedTimeTableByName(event) {
    const unique = [];
    const { time_table: slots, slot_duration_mins, inconsistent_slot_durations=false } = event;

    for (let endtime, i = 0; i < slots.length; i++) {
        endtime = (inconsistent_slot_durations && (i < (slots.length-1))) ? Moment.utc(slots[i+1].starttime).toISOString() : Moment.utc(slots[i].starttime).add(slot_duration_mins, 'minutes').toISOString();
        slots[i].endtime = endtime;

        if (i === 0) {
            // first slot - add as-is
            unique.push(slots[i]);
        } else {
            if (slots[i-1].broadcaster_display_name.toLowerCase() === slots[i].broadcaster_display_name.toLowerCase()) {
                // same streamer, update end time
                unique[unique.length-1].endtime = endtime;
            } else {
                // new streamer, add slot
                unique.push(slots[i]);
            }
        }
    }
    return unique;
}

export function getLineupUserIds(event, user_id) {
    // unique ids of folks on the lineup excluding ourselves and empty slots
    const ids = new Set(event.time_table
        .map(slot => slot.broadcaster_id)
        .filter(id => !!id)
    );

    const uniqueIds = Array.from(ids);
    const uniqueIdsExcludingSelf = uniqueIds.filter(id => id !== user_id);

    return { uniqueIds, uniqueIdsExcludingSelf };
}

export function getLineupUserLogins(event, user_login) {
    // unique ids of folks on the lineup excluding ourselves and empty slots
    const logins = new Set(event.time_table
        .map(slot => slot.broadcaster_display_name.toLowerCase().trim())
        .filter(user_login => !!user_login)
    );

    const uniqueLogins = Array.from(logins);
    const uniqueIdsExcludingSelf = uniqueLogins.filter(login => login !== user_login);

    return { uniqueLogins, uniqueIdsExcludingSelf };
}

export default function RaidPalView() {
    const dispatch = useDispatch();

    const [showModal, setShowModal] = useState(null);
    const [selectedStreamId, setSelectedStream] = useState(null);
    const [selectedStreamUserId, setSelectedStreamUserId] = useState(null);
    const [ selectedEventKey, setSelectedEventKey ] = useState(null);

    const { showAmPm, showRaidPalCreatedEvents } = useSelector(state => state.app.preferences);
    const { isFetching, lastError, /*lastUpdated,*/ data, events, streams } = useSelector(state => state.raidpal);
    const { user_id } = useSelector(state => state.session.data);
    const userCache = useSelector(state => state.users.cache);

    const { /*isFetching: isEventFetching,*/ lastError: eventLastError, cache } = events;
    const { isFetching: isStreamStatusFetching, lastError: streamLastError, lastUpdated: streamsLastUpdated } = streams;

    const now = Moment.utc();
    const selectedEvent = (selectedEventKey && cache[getSlug(selectedEventKey)]) || null;

    const hasCreatedEvents = useCallback((data) => data?.events?.length > 0 || false, []);

    const getRaidPalData = useCallback((data) => {
        return ((hasCreatedEvents(data) && showRaidPalCreatedEvents)
            ? [].concat(data?.events_joined || []).concat(data?.events || [])
            : (data?.events_joined || []))
            .filter((event, index, self) =>
                    index === self.findIndex((e) => (
                        e.title === event.title && e.starttime === event.starttime
                    ))
            )
            .sort((a, b) => new Date(a.starttime) - new Date(b.starttime));
    }, [ hasCreatedEvents, showRaidPalCreatedEvents ])

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
            // if we have selected created events too, smash the events together
            const raidpalData = getRaidPalData(data);
            // Preselect the best event
            if (raidpalData?.length) {

                // TODO: compare channel slot to now and choose the closest one, could be participating in multiple events
                // let liveEvents = data.events_joined
                //     .filter(e => now.isBetween(Moment.utc(e.starttime), Moment.utc(e.endtime)));
                // const defaultEvent = liveEvents[0] || data.events_joined[0];

                const eventKey = raidpalData[0].api_link;
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
    }, [dispatch, setSelectedEventKey, handleEventChange, getRaidPalData]);

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

    const selectedStream = (selectedStreamId && streams.data?.find(stream => stream.id === selectedStreamId)) ||
        (selectedStreamUserId && streams.data?.find(stream => stream.user_id === selectedStreamUserId)) || null;

    const handleToggleAmPm = useCallback((e) => {
        dispatch(setPreference('showAmPm', e.target.checked));
    }, [dispatch]);

    const handleToggleShowCreatedRaidpalEvents = useCallback(e => {
        dispatch(setPreference('showRaidPalCreatedEvents', e.target.checked));
    }, [dispatch]);

    const raidpalData = getRaidPalData(data);

    return (
        <Container>
            {lastError && (
                <Alert variant="danger" className="mt-3">
                    <ErrorMessage error={lastError} />
                </Alert>
            )}
            <div className="display-opts fle">
                <div className="opt-labels">
                    <label>Your Events</label>
                    {hasCreatedEvents(data) && (
                        <label><Form.Check type="switch" id="show-createdevents" label="Created events" checked={showRaidPalCreatedEvents} onChange={handleToggleShowCreatedRaidpalEvents} /></label>
                    )}
                </div>
            </div>
            {data ? (
                <Nav activeKey={selectedEventKey} className="flex-column event-list mb-3" onSelect={handleEventChange}>
                    {!raidpalData?.length ? (
                        <Nav.Item className="static"><Alert variant="warning" className="mt-3">You don't have any upcoming events :(</Alert></Nav.Item>
                    ) : (
                        <NavDropdown placement="bottom" menuVariant="dark" title={<span>{selectedEvent?.title || (selectedEventKey && raidpalData.find(e => e.api_link === selectedEventKey))?.title || 'Select RaidPal event...'}</span>}>
                            {raidpalData.map((event, i) => {
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
                    <ErrorMessage error={eventLastError} />
                </Alert>
            )}
            {streamLastError && (
                <Alert variant="danger" className="mt-3">
                    <ErrorMessage error={streamLastError} />
                </Alert>
            )}
            {selectedEvent && (
                <div className="event">
                    <h2><span>{selectedEvent.title}</span><a title="View on RaidPal" target="_blank" rel="noreferrer" href={selectedEvent.raidpal_link}><img src={RaidPalLogo} alt="View on RaidPal" /></a></h2>
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
                                userBadge = <><Badge bg="success">You</Badge></>;
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
                                            {currentLiveStream && <Badge bg="danger">
                                                <span className="viewers white">{ currentLiveStream.viewer_count > 1 ? <><i className="bi bi-eye-fill  "/> {
                                                    CondensedFormatter(currentLiveStream.viewer_count, 0)
                                                }</> : 'Live'}
                                        </span></Badge>}
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