import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Route,
    Switch,
} from 'react-router-dom';

import AdminPoints from './AdminPoints';
import AdminTeamList from './AdminTeamList';
import AdminDragons from './AdminDragons';
import Page404 from './Page404';
import UserWelcomePage from './UserWelcomePage';
import UserNavbar from './UserNavbar';

import './User.scss';
import UserList from './UserList';
import UserSettings from './UserSettings';

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
                    width={this.state.width}
                    username={this.props.user.name}
                    logout={this.props.databaseObjects.logout}
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
                                (<div className="container">
                                    <AdminTeamList databaseObjects={this.props.databaseObjects} />
                                </div>)
                            }
                        />
                        <Route
                            path="/user/players"
                            render={() =>
                                (<div className="container">
                                    <UserList databaseObjects={this.props.databaseObjects} />
                                </div>)
                            }
                        />
                        <Route
                            path="/user/settings"
                            render={() =>
                                (<div className="container">
                                    <UserSettings
                                        databaseObjects={this.props.databaseObjects}
                                        currentUser={this.props.user}
                                    />
                                </div>)
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
