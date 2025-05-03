import {Button, Col, Modal, Row} from "react-bootstrap";
import {useSelector} from "react-redux";
import CopyButton from "../common/CopyButton";
import {QRCode} from "react-qrcode-logo";

export default function QRCodeModal({ showModal, handleCloseModal }) {
    const userCache = useSelector(state => state.users.cache);
    const { login, user_id } = useSelector(state => state.session.data);

    // Get session channel name
    const channelUser = userCache[user_id];
    const displayName = channelUser?.display_name || login;

    return (
        <Modal show={showModal} onHide={handleCloseModal} size="lg" centered className="stream-modal">
            <Modal.Header closeButton>
                <Modal.Title id="stuffs">
                    {channelUser && channelUser.broadcaster_type === 'partner' &&
                        <i className="bi bi-patch-check-fill partner"/>}
                    {displayName}
                </Modal.Title>
                <CopyButton disabled={!displayName} value={displayName} variant="link" className="copy-channel-button">
                    <i className="bi bi-clipboard"></i>
                </CopyButton>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col className="qr-container">
                        <QRCode value={`https://twitch.tv/${encodeURIComponent(login)}`}
                                logoImage={channelUser?.profile_image_url || null}
                                removeQrCodeBehindLogo={true}
                                logoPadding={2}
                        />
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button className="viewStream" variant="secondary" href={"https://twitch.tv/"+login} target="_blank" rel="noreferrer">View Channel <i className="bi bi-box-arrow-up-right"/></Button>
                <div className="flex-grow-1" />
                <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}