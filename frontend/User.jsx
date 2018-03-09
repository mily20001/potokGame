import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Route,
    Switch,
} from 'react-router-dom';

import AdminWelcomePage from './AdminWelcomePage';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import FileUploader from './FileUploader';
import AdminMapManager from './AdminMapManager';
import AdminUsers from './AdminUsers';
import AdminPoints from './AdminPoints';
import AdminTeams from './AdminTeams';
import AdminRegions from './AdminRegions';
import AdminDragons from './AdminDragons';
import Page404 from './Page404';
import UserWelcomePage from './UserWelcomePage';
import UserNavbar from './UserNavbar';

import './User.scss';

export default class User extends Component {
    constructor() {
        super();
        this.state = {};
    }

    componentDidMount() {
        document.title = 'Panel Użytkownika';
    }

    render() {
        return (
            <div className="bg-dark text-white fullpage-container">
                <UserNavbar
                    toggleSidebar={this.toggleSidebar}
                    width={this.state.width}
                    username={this.props.user.name}
                />
                <div className="user-main-container">
                    <Switch>
                        <Route exact path="/user" component={UserWelcomePage} />
                        <Route
                            path="/user/dragons"
                            render={() =>
                                (<AdminDragons
                                    databaseObjects={this.props.databaseObjects}
                                />)
                            }
                        />
                        <Route
                            exact
                            path="/user/points"
                            render={() =>
                                <AdminPoints databaseObjects={this.props.databaseObjects} />
                            }
                        />
                        <Route
                            path="/user/teams"
                            render={() =>
                                <AdminTeams databaseObjects={this.props.databaseObjects} />
                            }
                        />
                        <Route component={Page404} />
                    </Switch>
                </div>
            </div>
        );
    }
}

User.propTypes = {
    user: PropTypes.object.isRequired,
    databaseObjects: PropTypes.object.isRequired,
};
