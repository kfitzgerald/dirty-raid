
import {Alert, Container} from "react-bootstrap";
import {useDispatch, useSelector} from "react-redux";
import ReUsableStreamList from "../streams/ReUsableStreamList";
import {useCallback} from "react";
import {fetchFollowedStreams} from "../streams/StreamActions";


export default function FollowersView() {

    const dispatch = useDispatch();

    const streams = useSelector(state => state.streams);
    const { isFetching, lastError, data, lastUpdated } = streams;

    const handleRefresh = useCallback(() => {
        dispatch(fetchFollowedStreams());
    }, [dispatch]);


    return <Container>
        {lastError && (
            <Alert variant="danger">
                {lastError.error_description || lastError.error || lastError}
            </Alert>
        )}

        {data?.length ? (
            <ReUsableStreamList
                handleRefresh={handleRefresh}
                streams={data}
                lastUpdated={lastUpdated}
                isFetching={isFetching}
            />
        ) : null}
    </Container>
}