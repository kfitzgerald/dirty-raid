import {Alert, Container} from "react-bootstrap";
import {useDispatch, useSelector} from "react-redux";
import ReUsableStreamList from "../streams/ReUsableStreamList";
import {useCallback} from "react";
import {fetchFollowedStreams} from "../streams/StreamActions";
import ErrorMessage from "../common/ErrorMessage";

export default function FollowersView() {
    const dispatch = useDispatch();

    const isFetching = useSelector(state => state.streams.isFetching);
    const lastError = useSelector(state => state.streams.lastError);
    const data = useSelector(state => state.streams.data);
    const lastUpdated = useSelector(state => state.streams.lastUpdated);

    const handleRefresh = useCallback(() => {
        dispatch(fetchFollowedStreams());
    }, [dispatch]);

    return <Container>
        {lastError && (
            <Alert variant="danger">
                <ErrorMessage error={lastError} />
            </Alert>
        )}

        <ReUsableStreamList
            handleRefresh={handleRefresh}
            streams={data}
            lastUpdated={lastUpdated}
            isFetching={isFetching}
        />
    </Container>
}
