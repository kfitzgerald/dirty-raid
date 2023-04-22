import {Alert, Badge, Button, Col, Modal, Row} from "react-bootstrap";
import {CondensedFormatter} from "../common/PrettyNumber";
import {TimeDuration} from "./TimeDuration";
import {useDispatch, useSelector} from "react-redux";
import Moment from "moment";
import {useCallback} from "react";
import {fetchRaidStart, fetchRaidStop, postChannelMessage} from "./StreamActions";
import ShowMoreText from "react-show-more-text";


export default function StreamInfoModal({ selectedStream, selectedUserId, lastUpdated, showModal, handleCloseModal }) {
    console.log(selectedStream)
    const dispatch = useDispatch();
    const userCache = useSelector(state => state.users.cache);
    const { user_id } = useSelector(state => state.session.data);
    const streams = useSelector(state => state.streams);
    const { raid } = streams;
    const { isFetching: isRaidFetching, /*isCancelled, lastError: raidLastError,*/ lastUpdated: raidStartedAt } = raid;

    const handleRaidStart = useCallback(() => {
        // console.log('DO THE RAID', selectedStream.user_id);
        dispatch(fetchRaidStart(selectedStream.user_id));
    }, [dispatch, selectedStream]);

    const handleRaidStop = useCallback(() => {
        dispatch(fetchRaidStop());
    }, [dispatch]);

    let isRaiding = false;
    if (raidStartedAt) {
        // raids last up to 90 seconds from execute, but can be executed faster in the Twitch UX
        // we'll at least block a second raid attempt until 90s after launch
        isRaiding = Moment(raidStartedAt).add(90, 'seconds').isAfter(Moment());
    }

    const selectedUser = userCache[selectedStream?.user_id || selectedUserId];

    return (
        <Modal show={showModal} onHide={handleCloseModal} size="lg" centered className="stream-modal">
            <Modal.Header closeButton>
                <Modal.Title id="stuffs">
                    {selectedUser && selectedUser.broadcaster_type === 'partner' &&
                        <i className="bi bi-patch-check-fill partner"/>}
                    {selectedStream?.user_name || selectedUser?.display_name || 'Streamer Offline!'}
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
                    <>
                        <Row>
                            <Col>
                                <Alert variant="danger">
                                    <i className="bi bi-exclamation-diamond"/> This channel is offline!
                                </Alert>
                            </Col>
                        </Row>
                        {selectedUser && (
                            <Row>
                                <Col className="channel-about">
                                    <label>About</label>
                                    <ShowMoreText lines={3}>
                                        {selectedUser.description}
                                    </ShowMoreText>
                                </Col>
                            </Row>
                        )}
                    </>
                )}

            </Modal.Body>
            <Modal.Footer>
                <Button className="viewStream" variant="secondary" href={"https://twitch.tv/"+selectedUser?.login} disabled={!selectedUser} target="_blank" rel="noreferrer">View Channel <i className="bi bi-box-arrow-up-right"/></Button>
                <div className="flex-grow-1" />
                {selectedStream && (selectedStream.user_id !== user_id) && (
                    isRaiding ? (
                        <Button disabled={isRaidFetching} variant="warning" onClick={handleRaidStop}>Cancel Raid</Button>
                    ) : (
                        <Button disabled={isRaidFetching} variant="danger" onClick={handleRaidStart}>Raid Now</Button>
                    )
                )}
                <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}