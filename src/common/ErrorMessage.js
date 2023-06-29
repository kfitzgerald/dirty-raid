/**
 * Error message component
 * @param error
 * @returns {JSX.Element}
 * @constructor
 */
export default function ErrorMessage({ error }) {

    // Extract the message from the response
    let message = error.error_description || error.error || error.message || (""+error);

    // Attempt to humanize the response
    if (message === 'invalid access token') {
        message = "Session expired, please login again :)";
    }

    return <>
        {message}
    </>
}