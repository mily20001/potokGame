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
                    <Link to="/admin/lol" className="list-group-item bg-secondary text-white">Manage Players</Link>
                    <Link to="/admin/map/upload" className="list-group-item bg-secondary text-white">Manage Dragons</Link>
                    <Link to="/admin/map" className="list-group-item bg-secondary text-white">Manage Game</Link>
                </ul>
            </div>
        );
    }
}

AdminSidebar.propTypes = {
    status: PropTypes.bool.isRequired,
    sidebarWidth: PropTypes.number.isRequired,
};
