import logo from "../logo.svg";
import './Loading.scss';

/**
 * Full screen component with logo spinner
 * @return {JSX.Element}
 * @constructor
 */
function Loading() {
    return (
        <div className="Loading">
            <header className="Loading-header">
                <img src={logo} className="Loading-logo" alt="logo" />
            </header>
        </div>
    );
}

export default Loading;