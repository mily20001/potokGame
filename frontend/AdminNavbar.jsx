import React from 'react';
import PropTypes from 'prop-types';
import {
    Link,
} from 'react-router-dom';

export default function AdminNavbar(props) {
    return (
        <nav className="navbar admin-navbar">
            <button
                type="button"
                className="btn btn-outline-light"
                onClick={props.toggleSidebar}
            >
                <i className="fa fa-bars" />
            </button>

            <Link to="/admin" className="navbar-brand text-white">{(props.width < 600) ? 'DotU' : 'Dragons of the Universe'}</Link>

            Witaj {props.username}!
        </nav>
    );
}

AdminNavbar.propTypes = {
    username: PropTypes.string.isRequired,
    toggleSidebar: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
};
