import React, { Component } from 'react';
import {
    Router,
    Route,
} from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory';

import App from './App';
import Admin from './Admin';
import Login from './Login';

export default class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: {},
        };

        this.history = createBrowserHistory();

        this.history.push('/login');

        this.setUser = this.setUser.bind(this);
    }

    setUser(user) {
        console.log(user);
        if (user === {}) {
            this.history.push('/login');
        } else if (user.role === 'admin') {
            this.history.push('/admin');
        } else if (user.role === 'player') {
            this.history.push('/');
        }

        this.setState({ user });
    }

    render() {
        return (
            <Router history={this.history}>
                <div className="container fullpage-container">
                    <Route exact path="/" component={App} />
                    <Route path="/admin" render={() => <Admin user={this.state.user} />} />
                    <Route
                        exact
                        path="/login"
                        render={() => <Login setUser={this.setUser} />}
                    />
                </div>
            </Router>
        );
    }
}
