import React, { Component } from 'react';
import {
    Router,
    Route,
    Switch,
} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory';
import Popup from 'react-popup';
import {NotificationContainer} from 'react-notifications';

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
                getImage: this.getImage.bind(this),
                refreshDatabase: this.refreshDatabase.bind(this),
            },
        };

        this.imageCache = {};

        this.history = createBrowserHistory();

        this.redirectPath = window.location.pathname;

        this.history.push('/loading');

        this.setUser = this.setUser.bind(this);
        this.getImage = this.getImage.bind(this);

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

    // TODO maybe switch to browser storage
    getImage(imageId, callback) {
        if (this.imageCache[imageId] !== undefined) {
            if(this.imageCache[imageId].status === 'loading') {
                // TODO maybe add some callback queue instead
                setTimeout(this.getImage, 50, imageId, callback);
                return;
            }

            callback(
                this.imageCache[imageId].data,
                this.state.databaseObjects.images[imageId].dataType,
            );
        } else {
            this.imageCache[imageId] = {status: 'loading'};
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `/get_image?id=${imageId}`, true);
            xhr.onload = () => {
                const result = JSON.parse(xhr.responseText);
                if (result.data !== undefined) {
                    this.imageCache[result.id] = { data: result.data, status: 'ready'};
                    callback(result.data, result.dataType);
                } else {
                    console.log(`error while getting image ${imageId}`);
                }
            };
            xhr.send();
        }
    }

    /** example usage:
     * this.props.databaseObjects.getImage(11, (data) => {
            let imgString = 'data:image/png;base64,';
            imgString += btoa(String.fromCharCode.apply(null, (new Buffer(data.data))));
        });
     */

    getAdminDatabaseObjects() {
        return Promise.all([this.getDatabaseData('/get_dragons', 'dragons'),
            this.getDatabaseData('/get_teams', 'teams'),
            this.getDatabaseData('/get_users', 'users'),
            this.getDatabaseData('/get_fields', 'fields'),
            this.getDatabaseData('/get_regions', 'regions'),
            this.getDatabaseData('/get_image_list', 'images'),
        ]);
    }

    getUserDatabaseObjects() {
        return Promise.all([this.getDatabaseData('/get_dragons', 'dragons'),
            this.getDatabaseData('/get_teams', 'teams'),
            this.getDatabaseData('/get_users', 'users'),
            this.getDatabaseData('/get_fields', 'fields'),
            this.getDatabaseData('/get_regions', 'regions'),
            this.getDatabaseData('/get_image_list', 'images'),
        ]);
    }

    setUser(user) {
        console.log(user);
        this.setState({ user }, () => {
            if (Object.keys(user).length === 0) {
                this.history.push('/login');
            } else if (user.role === 'admin') {
                const destAddr = (this.redirectPath === '/' || this.redirectPath === '/loading' || this.redirectPath === '/login')
                    ? '/admin' : this.redirectPath;

                this.getAdminDatabaseObjects().then(() => this.history.push(destAddr));
            } else if (user.role === 'player') {
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
