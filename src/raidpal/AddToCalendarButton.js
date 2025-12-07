import { Button } from "react-bootstrap";
import PropTypes from "prop-types";
import { generateIcsCalendar } from "ts-ics";
import { useCallback } from "react";

export default function AddToCalendarButton({ event, slot, children }) {

    const handleAddToCalendar = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        // On click, generate ICS file
        const string = generateIcsCalendar({
            events: [
                {
                    start: {date: new Date(slot.starttime) },
                    end: {date: new Date(slot.endtime) },
                    summary: `${event.title} – ${slot.broadcaster_display_name || 'Unoccupied'}`,
                    description: event.description,
                    uid: `${event.raidpal_link}?slot=${slot.order}`,
                    url: event.raidpal_link,
                    location: event.raidpal_link,
                }
            ],
            version: '2.0',
            prodId: '-//DirtyRaid//NONSGML//EN',
            method: 'REQUEST',
            priority: 5,
        })

        // Attach to dom and trigger download
        const url = URL.createObjectURL(new Blob([string], { type: 'text/calendar' }));
        const link = document.createElement('a');
        link.href = url;

        // Get last segment of url (slug) for filename
        const segment = event.raidpal_link.split('/').filter(Boolean).pop();
        link.download = `${segment}_${slot.broadcaster_display_name || slot.order}.ics`;

        // Attach to dom, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [event, slot]);

    return (
        <Button className="add-to-calendar" variant="link" onClick={handleAddToCalendar}><i className="bi bi-calendar2-plus"></i> {children}</Button>
    );
}

AddToCalendarButton.propTypes = {
    event: PropTypes.object.isRequired,
    slot: PropTypes.object.isRequired,
    children: PropTypes.any
};