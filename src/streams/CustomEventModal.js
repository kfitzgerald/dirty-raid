import {useCallback, useRef, useState} from "react";
import {Alert, Button, Col, Form, Modal, Row} from "react-bootstrap";

export default function CustomEventModal({ showModal, handleCloseModal, onCustomEventLoaded }) {
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(false);
    const customURLRef = useRef();

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();

        // Fetching, no go
        if (fetching) return;

        // Fetch payload
        setFetching(true);
        setError(null);

        try {
            // Fetch the payload
            const data = await fetch(customURLRef.current.value, {
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
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Custom Event URL
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col>
                            <Form.Group controlId="prompt" className="mb-3">
                                <Form.Label className="fw-semibold">Custom Event URL</Form.Label>
                                <Form.Control
                                    name="prompt"
                                    ref={customURLRef}
                                    placeholder={"e.g. https://your.event/etc"}
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
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                    <Button variant="primary" type="submit" onClick={handleSubmit} disabled={fetching}>
                        Fetch Event
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}