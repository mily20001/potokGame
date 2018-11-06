import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NotificationManager } from 'react-notifications';

import './Login.scss';
import errorCodes from './../backend/errorCodes';

function getErrorReason(errCode) {
    // TODO improve error reasoning
    let wyn;
    Object.keys(errorCodes).forEach((reason) => {
        if (errorCodes[reason] === errCode) {
            wyn = reason;
        }
    });

    return wyn;
}

export default class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: '',
            loginError: -1,
        };

        this.handleField = this.handleField.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        document.title = 'Zaloguj się';
    }

    handleField(fieldName, event) {
        this.setState({ [fieldName]: event.target.value });
    }

    handleSubmit(e) {
        e.preventDefault();

        const requestData = new Map();
        requestData.set('username', this.state.username);
        requestData.set('password', this.state.password);

        const requestString = [...requestData].map(([key, val]) => (`${key}=${val}`)).join('&');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/login', true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onload = () => {
            // console.log(xhr.responseText);
            try {
                const result = JSON.parse(xhr.responseText);
                // console.log(result);
                if (result.err !== undefined) {
                    this.setState({ loginError: result.err });
                    this.setState({ username: '', password: '' });
                } else if (result.user === undefined) {
                    throw new Error();
                } else {
                    this.setState({ loginError: -1 });
                    NotificationManager.success('Zalogowano');
                    this.props.setUser(result.user);
                }
            } catch (err) {
                this.setState({ username: '', password: '' });
                NotificationManager.error('Logowanie nie powiodło się');
            }
        };
        xhr.send(requestString);
    }

    render() {
        return (
            <div className="container v-centered login-main-container">
                <div className="jumbotron bg-dark text-light">
                    <h1 className="text-center">Dragons of the Universe</h1><br />
                    <h2 className="text-center">Logowanie</h2><br />
                    <form className="form-horizontal" onSubmit={this.handleSubmit}>
                        <div className="form-group row">
                            <label className="control-label col-sm-2" htmlFor="username">
                                Nazwa użytkownika:
                            </label>
                            <div className="col-sm-10">
                                <input
                                    type="text"
                                    className="form-control bg-dark text-white"
                                    id="username"
                                    name="username"
                                    placeholder="Wprowadź nazwę użytkownika"
                                    value={this.state.username}
                                    onChange={e => this.handleField('username', e)}
                                />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label className="control-label col-sm-2" htmlFor="pwd">Hasło:</label>
                            <div className="col-sm-10">
                                <input
                                    type="password"
                                    className="form-control bg-dark text-white"
                                    id="pwd"
                                    name="password"
                                    placeholder="Wprowadź hasło"
                                    value={this.state.password}
                                    onChange={e => this.handleField('password', e)}
                                />
                            </div>
                        </div>
                        <div id="login-error" className={this.state.loginError === -1 ? 'invisible' : 'visible'}>
                            <div className="alert alert-danger" role="alert">
                                {getErrorReason(this.state.loginError)}
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="col-sm-offset-2 col-sm-10">
                                <button
                                    type="submit"
                                    className="btn btn-outline-light btn-lg"
                                >
                                    Zaloguj
                                </button>
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
};

