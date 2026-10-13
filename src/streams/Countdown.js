import {useEffect, useRef} from "react";

export function Countdown({ to }) {
    const spanRef = useRef()

    useEffect(() => {
        const interval = setInterval(() => {
            if(spanRef.current) spanRef.current.innerHTML = Math.max(0, Math.round((to - Date.now()) / 1000));
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [to, spanRef]);

    const diff = Math.max(0, Math.round((to - Date.now()) / 1000));

    return (
        <span ref={spanRef}>{diff}</span>
    );
}
