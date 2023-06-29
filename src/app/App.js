import logo from '../logo.svg';
import './App.scss';
import Loading from "../common/Loading";
import {useDispatch, useSelector} from "react-redux";
import {fetchTokenValidate, receiveTokenValidateError, setOAuthToken} from "../session/SessionActions";
import {useEffect} from "react";
import {Alert} from "react-bootstrap";
import StreamList from "../streams/StreamList";

import {REQUIRED_SCOPES} from "../common/Constants";
import ErrorMessage from "../common/ErrorMessage";

function cleanURL() {
    window.history.replaceState("", document.title, window.location.pathname);
}

function App() {

    const dispatch = useDispatch();
    const session = useSelector(state => state.session);

    const { lastError, token, data } = session;

    // Check for oauth return params on load
    useEffect(() => {

        // Check for OAuth authorization
        if (window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const hashData = Object.fromEntries(hashParams.entries());
            dispatch(setOAuthToken(hashData));
            cleanURL();
        }

        // Check for OAuth error
        if (window.location.search) {
            const searchParams = new URLSearchParams(window.location.search.substring(1))
            const searchData = Object.fromEntries(searchParams.entries());
            dispatch(receiveTokenValidateError(searchData));
            cleanURL();
        }

    }, [dispatch]);

    // Validate the token on load to ensure the session is still valid
    useEffect(() => {

        // If token but no session data, do validation
        if (token && token.access_token && !data) {
            dispatch(fetchTokenValidate());
        }

    }, [dispatch, token, data])

    // If the token is saved and valdiated, show the stream list
    if (!lastError && token && token.access_token && data && data.user_id) {
        // app is fully ready
        return <StreamList/>;
    }

    // If the token is saved but not validated, show loader
    if (!lastError && token && token.access_token && !data) {
        // token is received, needs verification (show loading screen)
        return <Loading/>;
    }

    // No token or error - show login page

    // Build OAuth authorize URL
    const oauthParams = new URLSearchParams();
    oauthParams.set('client_id', process.env.REACT_APP_CLIENT_ID)
    oauthParams.set('force_verify', 'false')
    oauthParams.set('redirect_uri', window.location.href.split('?')[0])
    oauthParams.set('response_type', 'token');
    oauthParams.set('scope', REQUIRED_SCOPES.join(' '));
    oauthParams.set('state', ':)')

    return (
        <div className="App">
            <div className="App-header">
                {lastError ? (
                    <Alert variant="danger">
                        <ErrorMessage error={lastError} />
                    </Alert>
                ) : (
                    <img src={logo} className="App-logo" alt="logo" />
                )}
                <p>
                    <code>DirtyRaid™</code> helps you find a raid target.
                </p>
                <p>To get started, <a
                        className="App-link btn"
                        href={"https://id.twitch.tv/oauth2/authorize?" + oauthParams.toString()}
                        rel="noreferrer"
                    >
                        Login with Twitch
                    </a>
                </p>
                <footer><a href="https://github.com/kfitzgerald/dirty-raid#add-to-obs" target="_blank" rel="noreferrer">Setup an OBS Dock</a> • <a href="https://github.com/kfitzgerald/dirty-raid" target="_blank" rel="noreferrer">Open Source</a> app made by <a href="https://www.twitch.tv/dirtybriefs" target="_blank" rel="noreferrer">Dirtybriefs</a>.</footer>
            </div>
        </div>
    );
}

export default App;
