import {Button} from "react-bootstrap";

/**
 * Sortable stream fields
 * @type {{VIEWER_COUNT: string, STARTED_AT: string, IS_MATURE: string, TITLE: string, USER_NAME: string, GAME_NAME: string}}
 */
export const SORT_BY = {
    USER_NAME: 'user_name',
    GAME_NAME: 'game_name',
    VIEWER_COUNT: 'viewer_count',
    STARTED_AT: 'started_at',
    TITLE: 'title',
    IS_MATURE: 'is_mature'
};

/**
 * Sort directions
 * @type {{ASC: string, DESC: string}}
 */
export const SORT_DIRECTION = {
    ASC: 'asc',
    DESC: 'desc'
};

/**
 * Sortable header component
 * @param children
 * @param field
 * @param sortBy
 * @param sortDir
 * @param onChange
 * @return {JSX.Element}
 * @constructor
 */
export function SortableField({children, field, sortBy, sortDir, onChange}) {
    return <Button variant="link" onClick={() => {
        if (field === sortBy) {
            // change direction
            onChange(field, sortDir === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC);
        } else {
            // change field
            onChange(field, SORT_DIRECTION.ASC);
        }
    }}>
        {children} {sortBy === field &&
        <i className={`bi bi-caret-${sortDir === SORT_DIRECTION.ASC ? 'up' : 'down'}-fill`}/>}
    </Button>;
}