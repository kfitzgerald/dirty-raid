import {Button, Overlay, Tooltip} from "react-bootstrap";
import propTypes from "prop-types";
import React, {useEffect, useRef, useState} from "react";
import ClipboardJS from "clipboard";

export default function CopyButton({ value, children, ...buttonProps }) {

    const buttonRef = useRef(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (buttonRef.current) {
            const clipboard = new ClipboardJS(buttonRef.current);
            let timeoutHandle;
            clipboard.on('success', () => {
                setCopied(true);
                timeoutHandle = setTimeout(() => {
                    setCopied(false);
                }, 2000);
            });
            return () => {
                clipboard.destroy();
                clearTimeout(timeoutHandle);
            };
        }
    }, [buttonRef, setCopied]);

    return (
        <>
            <Button data-clipboard-text={value} ref={buttonRef} {...buttonProps}>{children}</Button>
            <Overlay target={buttonRef.current} show={copied} placement="auto" flip>
                <Tooltip id="copied-tooltip">
                    Copied
                </Tooltip>
            </Overlay>
        </>
    );
}

CopyButton.propTypes = {
    value: propTypes.string,
    children: propTypes.any
};

CopyButton.defaultProps = {
    label: 'Copy'
};