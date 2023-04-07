import {useEffect, useState} from "react";

export function Countdown({ to }) {
    // Could do pure-dom hacks, but let's keep it stateful
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(tick + 1);
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [tick]);

    const diff = Math.max(0, Math.round((to - Date.now()) / 1000));

    return (
        <>{diff}</>
    );
}