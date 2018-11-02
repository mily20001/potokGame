import React, { Component } from 'react';
import {
    Router,
    Route,
    Switch,
} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory';
import Popup from 'react-popup';
import { NotificationContainer, NotificationManager } from 'react-notifications';

import 'react-notifications/lib/notifications.css';

import App from './App';
import Admin from './Admin';
import User from './User';
import Login from './Login';
import LoadingScreen from './LoadingScreen';
import Page404 from './Page404';

export default class Main extends Component {
    constructor() {
        super();
        this.state = {
            user: {},
            databaseObjects: {
                refreshDatabase: this.refreshDatabase.bind(this),
                refreshCurrentUser: this.refreshCurrentUser.bind(this),
                logout: this.logout.bind(this),
            },
        };

        this.history = createBrowserHistory();

        this.redirectPath = window.location.pathname;

        this.history.push('/loading');

        this.setUser = this.setUser.bind(this);

        this.getUser();
    }

    logout() {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/logout', true);
        xhr.onload = () => {
            const result = JSON.parse(xhr.responseText);
            if (result.ok !== undefined) {
                NotificationManager.success('Wylogowano');
                this.setUser({});
            } else {
                NotificationManager.error('Wylogowanie nie powiodło się');
            }
        };
        xhr.send();
    }

    refreshCurrentUser() {
        this.redirectPath = window.location.pathname;
        this.getUser();
    }

    getUser() {
        const xhr = new XMLHttpRequest();

        xhr.open('GET', '/get_user', true);
        xhr.onload = () => {
            const result = JSON.parse(xhr.responseText);
            if (result.user !== undefined) {
                this.setUser(result.user);
            } else {
                this.setUser({});
            }
        };
        xhr.send();
    }

    getDatabaseData(dataURL, dataId) {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', dataURL, true);
            xhr.onload = () => {
                const result = JSON.parse(xhr.responseText);
                if (result[dataId] !== undefined) {
                    this.setState({
                        databaseObjects: {
                            ...this.state.databaseObjects,
                            [dataId]: result[dataId],
                        },
                    }, resolve);
                    console.log(result[dataId]);
                } else {
                    console.log(`error while getting ${dataId}`);
                    /* WELP */
                    resolve();
                }
            };
            xhr.send();
        });
    }

    getAdminDatabaseObjects() {
        return Promise.all([this.getDatabaseData('/get_dragons', 'dragons'),
            this.getDatabaseData('/get_teams', 'teams'),
            this.getDatabaseData('/get_users', 'users'),
            this.getDatabaseData('/get_fields', 'fields'),
            this.getDatabaseData('/get_regions', 'regions'),
            this.getDatabaseData('/get_image_list', 'images'),
            this.getDatabaseData('/get_config', 'config'),
        ]);
    }

    getUserDatabaseObjects() {
        return Promise.all([this.getDatabaseData('/get_dragons', 'dragons'),
            this.getDatabaseData('/get_teams', 'teams'),
            this.getDatabaseData('/get_users', 'users'),
            this.getDatabaseData('/get_fields', 'fields'),
            this.getDatabaseData('/get_regions', 'regions'),
            this.getDatabaseData('/get_image_list', 'images'),
            this.getDatabaseData('/get_config', 'config'),
        ]);
    }

    setUser(user) {
        console.log(user);
        this.setState({ user }, () => {
            if (Object.keys(user).length === 0) {
                this.history.push('/login');
            } else if (user.role === 'admin') {
                this.history.push('/loading');
                const destAddr = (this.redirectPath === '/' || this.redirectPath === '/loading' || this.redirectPath === '/login')
                    ? '/admin' : this.redirectPath;

                this.getAdminDatabaseObjects().then(() => this.history.push(destAddr));
            } else if (user.role === 'player') {
                this.history.push('/loading');
                const destAddr = (this.redirectPath === '/' || this.redirectPath === '/loading' || this.redirectPath === '/login')
                    ? '/user' : this.redirectPath;

                this.getUserDatabaseObjects().then(() => this.history.push(destAddr));
            }
        });
    }

    refreshDatabase(dataId) {
        if (dataId === 'users') {
            this.getDatabaseData('/get_users', 'users');
        } else if (dataId === 'teams') {
            this.getDatabaseData('/get_teams', 'teams');
        } else if (dataId === 'regions') {
            this.getDatabaseData('/get_regions', 'regions');
        } else if (dataId === 'fields') {
            this.getDatabaseData('/get_fields', 'fields');
        } else if (dataId === 'dragons') {
            this.getDatabaseData('/get_dragons', 'dragons');
        } else if (dataId === 'images') {
            this.getDatabaseData('/get_image_list', 'images');
        } else if (dataId === 'config') {
            this.getDatabaseData('/get_config', 'config');
        } else if (dataId === 'currentUser') {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/get_user', true);
            xhr.onload = () => {
                const result = JSON.parse(xhr.responseText);
                if (result.user !== undefined) {
                    this.setState({ user: result.user });
                }
            };
            xhr.send();
        }
    }

    render() {
        return (
            <Router history={this.history}>
                <div className="container fullpage-container">
                    <Popup />
                    <NotificationContainer />
                    <Switch>
                        <Route exact path="/" component={App} />
                        <Route
                            path="/admin"
                            render={() =>
                            (<Admin
                                user={this.state.user}
                                databaseObjects={this.state.databaseObjects}
                            />)}
                        />
                        <Route
                            path="/user"
                            render={() =>
                                (<User
                                    user={this.state.user}
                                    databaseObjects={this.state.databaseObjects}
                                />)}
                        />
                        <Route
                            exact
                            path="/login"
                            render={() => <Login setUser={this.setUser} />}
                        />
                        <Route exact path="/loading" component={LoadingScreen} />
                        <Route component={Page404} />
                    </Switch>
                </div>
            </Router>
        );
    }
}
