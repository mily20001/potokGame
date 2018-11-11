import React from 'react';
import PropTypes from 'prop-types';

import './User.scss';

export default function UserGameLog(props) {
    let history = '';
    try {
        history = JSON.parse(props.databaseObjects.config.lastLog).join('\n');
    } catch (e) {
        history = 'Brak';
    }

    return (
        <div className="container">
            <div className="user-hist-box">
                <pre>{history}</pre>
            </div>
        </div>);
}

UserGameLog.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
