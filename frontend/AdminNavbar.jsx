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

            <div className="admin-name-container">
                Witaj {props.username}!
                <Link to="/admin/settings">
                    <i className="fa fa-cog" />
                </Link>
                <i onClick={props.logout} className="fa fa-power-off" />
            </div>
        </nav>
    );
}

AdminNavbar.propTypes = {
    username: PropTypes.string.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
    width: PropTypes.number.isRequired,
    logout: PropTypes.func.isRequired,
};
