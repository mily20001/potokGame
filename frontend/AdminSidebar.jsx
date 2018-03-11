import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Link,
} from 'react-router-dom';

export default class AdminSidebar extends Component {
    render() {
        const style = {
            width: this.props.status ? '0' : `${this.props.sidebarWidth}px`,
        };

        return (
            <div className="full-height admin-sidebar" style={style}>
                <ul className="list-group">
                    <Link
                        to="/admin/map/upload"
                        className="list-group-item sidebar-button"
                    >
                        Wyślij plik
                    </Link>
                    <Link
                        to="/admin/map"
                        className="list-group-item sidebar-button"
                    >
                        Ustaw pola na mapie
                    </Link>
                    <Link
                        to="/admin/add_user"
                        className="list-group-item sidebar-button"
                    >
                        Dodaj użytkownika
                    </Link>
                    <Link
                        to="/admin/teams"
                        className="list-group-item sidebar-button"
                    >
                        Zarządzaj drużynami
                    </Link>
                    <Link
                        to="/admin/points"
                        className="list-group-item sidebar-button"
                    >
                        Zarządzaj punktami
                    </Link>
                    <Link
                        to="/admin/regions"
                        className="list-group-item sidebar-button"
                    >
                        Zarządzaj regionami
                    </Link>
                    <Link
                        to="/admin/dragons"
                        className="list-group-item sidebar-button"
                    >
                        Zarządzaj smokami
                    </Link>
                    <Link
                        to="/admin/users"
                        className="list-group-item sidebar-button"
                    >
                        Zarządzaj użytkownikami
                    </Link>
                </ul>
            </div>
        );
    }
}

AdminSidebar.propTypes = {
    status: PropTypes.bool.isRequired,
    sidebarWidth: PropTypes.number.isRequired,
};
