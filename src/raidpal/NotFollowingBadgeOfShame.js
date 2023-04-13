import {useSelector} from "react-redux";
import {Badge} from "react-bootstrap";

export default function NotFollowingBadgeOfShame({ broadcaster_id }) {
    const { cache } = useSelector(state => state.followers);

    // Don't auto fetch rn - done when RP lineup is fetched
    // const dispatch = useDispatch();
    // useEffect(() => {
    //     dispatch(fetchFollowedChannels([broadcaster_id]));
    // }, [ dispatch, broadcaster_id ])

    const entry = cache[broadcaster_id];

    // No entry? prob fetching
    if (!entry) return null;
    if (entry.followed_at) {
        return null; // already following
    } else {
        return <><Badge bg="warning">Not Following</Badge><br /></>
    }
}