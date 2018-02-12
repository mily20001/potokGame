import React, { Component } from 'react';
import {
    BrowserRouter,
    Route,
    Link,
} from 'react-router-dom';

export default class AdminSideBar extends Component {
    render() {
        return (
            <div className="container sidebar">
                <ul className="list-group">
                    <Link to="/login" className="list-group-item bg-secondary text-white">Manage Players</Link>
                    <Link to="/login" className="list-group-item bg-secondary text-white">Manage Dragons</Link>
                    <Link to="/login" className="list-group-item bg-secondary text-white">Manage Game</Link>
                </ul>
            </div>
        );
    }
}
