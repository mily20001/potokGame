import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactRouterPropTypes from 'react-router-prop-types';

import './Login.scss';

export default class Login extends Component {
    componentDidMount() {
        console.log(this.props.history);
    }
    render() {
        return (
            <div className="container v-centered login-main-container">
                <div className="jumbotron bg-dark text-light">
                    <h1 className="text-center">Login</h1><br />
                    <form className="form-horizontal" action="index.html" method="post">
                        <div className="form-group row">
                            <label className="control-label col-sm-2" htmlFor="username">Username:</label>
                            <div className="col-sm-10">
                                <input type="text" className="form-control bg-dark text-white" id="username" name="username" placeholder="Enter username" />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="control-label col-sm-2" htmlFor="pwd">Password:</label>
                            <div className="col-sm-10">
                                <input type="password" className="form-control bg-dark text-white" id="pwd" name="password" placeholder="Enter password" />
                            </div>
                        </div>
                        <div id="login-error" className="invisible">
                            <div className="alert alert-danger" role="alert">
                                Incorrect username or password
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="col-sm-offset-2 col-sm-10">
                                <button type="submit" className="btn btn-outline-light btn-lg">Login</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

        );
    }
}

Login.propTypes = {
    setUser: PropTypes.func.isRequired,
    history: ReactRouterPropTypes.history.isRequired,
};

