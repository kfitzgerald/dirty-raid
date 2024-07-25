import React, {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import * as propTypes from 'prop-types';

export default function Dropzone({ onFile, children }) {

    const onDrop = useCallback(acceptedFiles => {
        const first = acceptedFiles[0];
        if (first) onFile(first);
    }, [onFile]);

    const onDropRejected = useCallback(rejectedFiles => {
        // Do something with the files
        console.log('rejected: ' + rejectedFiles);
    }, []);

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        onDropRejected,
        maxFiles: 1,
        accept: {
            'application/json': ['.json'],
        },
        noClick: true
    });

    return (
        <div id="dropzone" {...getRootProps()}>
            {children}
            <input {...getInputProps()} />
            <div id="drop-indicator" className={isDragActive ? 'd-flex' : 'd-none'}>
                <div className="rainbow-text">
                    Oh yeah, drop that custom event JSON file here!
                </div>
            </div>
        </div>
    )
}

Dropzone.propTypes = {
    onFile: propTypes.func,
    children: propTypes.any,
};