import {useEffect, useState} from "react";
import Moment from "moment";

/**
 * Component to self-refresh relative time durations
 * @param time
 * @return {JSX.Element}
 * @constructor
 */
export function TimeDuration({time}) {
    // Could do pure-dom hacks, but let's keep it stateful
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(tick + 1);
        }, 15000);

        return () => {
            clearInterval(interval);
        };
    }, [tick]);

    const duration = Moment.utc(Moment().diff(Moment(time)));

    return (
        <span className="uptime" title={time}>
            <span>{duration.format('H')}</span>h&nbsp;
            <span>{duration.format('mm')}</span>m
        </span>
    );
}