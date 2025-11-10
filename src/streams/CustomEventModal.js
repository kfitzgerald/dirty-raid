import {useCallback, useRef, useState} from "react";
import {Alert, Button, Col, Form, Modal, Row, Tab, Tabs} from "react-bootstrap";
import {useDispatch, useSelector} from "react-redux";
import Moment from "moment";
import {removeCustomEvent, selectCustomEvent} from "../raidpal/RaidPalActions";

export default function CustomEventModal({ showModal, handleCloseModal, onCustomEventLoaded }) {
    const dispatch = useDispatch();
    const { events: customEvents } = useSelector(state => state.custom);
    const [fetching, setFetching] = useState(false);
    const [activeTab, setActiveTab] = useState('load');
    const [error, setError] = useState(false);
    const customURLRef = useRef();

    const normalizeUrl = useCallback((raw) => {
        try {
            // Ensure we have a protocol for URL parsing
            const input = raw?.trim();
            if (!input) return null;

            const withProtocol = /^(https?:)?\/\//i.test(input) ? input : `https://${input}`;
            const url = new URL(withProtocol);

            // If the host is raidpal.com, and path contains "/event/", map it to the API endpoint
            const host = url.hostname.replace(/^www\./, '');
            // If it's already the API host, keep as-is
            if (host === 'api.raidpal.com') {
                return url.toString();
            }

            if (host === 'raidpal.com') {
                const parts = url.pathname.split('/').filter(Boolean);
                const idx = parts.indexOf('event');
                if (idx !== -1 && idx + 1 < parts.length) {
                    // Everything after 'event' composes the slug
                    const slug = parts.slice(idx + 1).join('/');
                    return `https://api.raidpal.com/rest/event/${slug}`;
                }
            }

            // Otherwise return the original URL
            return url.toString();
        } catch (e) {
            // Not a valid URL; return as-is and let fetch fail which is handled
            return raw;
        }
    }, []);

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();

        // Fetching, no go
        if (fetching) return;

        // Fetch payload
        setFetching(true);
        setError(null);

        try {
            // Build the effective URL: if it's a RaidPal event URL, map to the API endpoint
            const effectiveUrl = normalizeUrl(customURLRef.current.value);

            // Fetch the payload
            const data = await fetch(effectiveUrl, {
                method: 'GET',
                credentials: "omit",
                headers: new Headers({
                    'Accept': 'application/json,text/javascript'    // we always want JSON
                })
            })
                .then(res => res.json())

            onCustomEventLoaded(data);

        } catch (err) {
            setError(err);
            console.error('Failed to fetch custom event', err);
        }

        setFetching(false);

    }, [fetching, onCustomEventLoaded, customURLRef]);

    return (
        <Modal data-bs-theme="dark" show={showModal} onHide={handleCloseModal} size="lg" centered className="custom-event-url">
            <Modal.Header closeButton>
                <Modal.Title>
                    Custom Events
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} id="custom-event-tabs" className="mb-3">
                    <Tab eventKey="load" title="Load Custom Event">
                        <Form id="custom-event-form" onSubmit={handleSubmit}>
                            <Row>
                                <Col>
                                    <Form.Group controlId="prompt" className="mb-3">
                                        <Form.Label className="fw-semibold">Custom Event URL</Form.Label>
                                        <Form.Control
                                            name="prompt"
                                            ref={customURLRef}
                                            placeholder={"e.g. https://raidpal.com/en/event/my-event or https://api.raidpal.com/rest/event/my-event"}
                                            type="text"
                                            required={true}
                                        />
                                        <Form.Text><a href="https://github.com/kfitzgerald/dirty-raid?tab=readme-ov-file#custom-events" rel="noreferrer" target="_blank">See the docs</a> for more information on custom events.</Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                            {error && (
                                <Row>
                                    <Col>
                                        <Alert variant="danger">Failed to load custom event :(</Alert>
                                    </Col>
                                </Row>
                            )}
                        </Form>
                    </Tab>
                    <Tab eventKey="manage" title="Manage Custom Events">
                        {customEvents.length === 0 ? (
                            <Alert variant="secondary">No custom events saved yet.</Alert>
                        ) : (
                            <div className="list-group">
                                {customEvents.map(({ key, data }) => (
                                    <div
                                        key={key}
                                        className="list-group-item d-flex flex-column flex-sm-row align-items-start align-items-sm-center"
                                    >
                                        <div className="event-title flex-grow-1 me-sm-3">
                                            <div className="fw-semibold">{data.event.title}</div>
                                            <div className="text-muted">{Moment(data.event.starttime).format('ddd MMM Do, YYYY HH:mm')}</div>
                                        </div>
                                        <div className="event-actions d-flex flex-wrap gap-2 justify-content-end mt-2 mt-sm-0 ms-sm-3">
                                            <Button size="sm" variant="outline-primary" onClick={() => { dispatch(selectCustomEvent(key)); handleCloseModal(); }}>Select</Button>
                                            <Button size="sm" variant="outline-danger" onClick={() => dispatch(removeCustomEvent(key))}><i className="bi bi-trash"/> Delete</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Tab>
                </Tabs>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModal}>
                    Close
                </Button>
                {activeTab === 'load' && (
                    <Button variant="primary" type="submit" form="custom-event-form" disabled={fetching}>
                        Fetch Event
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
}
