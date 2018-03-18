import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NotificationManager } from 'react-notifications';

import './UserSettings.scss';

export default class UserSettings extends Component {
    constructor(props) {
        super();

        this.cleanState = {
            passwordField: '',
            passwordField2: '',
            usernameField: '',
        };

        this.state = {
            ...this.cleanState,
            usernameField: props.currentUser.username,
        };

        this.handleField = this.handleField.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.clearState = this.clearState.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ usernameField: nextProps.currentUser.username });
    }

    clearState() {
        this.setState({ ...this.cleanState, usernameField: this.props.currentUser.username });
    }

    handleField(fieldName, event) {
        this.setState({ [fieldName]: event.target.value });
    }

    handleSubmit(e) {
        e.preventDefault();

        if (this.state.passwordField !== this.state.passwordField2) {
            NotificationManager.error('Podane hasła nie zgadzają się', 'Błąd');
            return;
        }

        const data = new FormData();

        if (this.state.usernameField.length > 0
            && this.state.usernameField !== this.props.currentUser.username) {
            data.append('username', this.state.usernameField);
        }

        if (this.state.passwordField !== '') {
            data.append('password', this.state.passwordField);
        }

        data.append('id', this.props.currentUser.id);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/add_user', true);
        xhr.onload = () => {
            console.log(xhr.responseText);
            try {
                const uploadResponse = JSON.parse(xhr.responseText);
                if (uploadResponse.ok !== undefined) {
                    this.props.databaseObjects.refreshDatabase('users');
                    this.props.databaseObjects.refreshCurrentUser();
                    NotificationManager.success('Zapisano zmiany');
                    this.clearState();
                } else {
                    NotificationManager.error('Nie udało się zapisać zmian', 'Błąd');
                }
            } catch (er) {
                NotificationManager.error('Nie udało się zapisać zmian', 'Błąd');
            }
        };
        xhr.send(data);
    }

    generateFields() {
        return [
            { id: 'name', label: 'Imię' },
            { id: 'surname', label: 'Nazwisko' },
            { id: 'hp', label: 'HP' },
            { id: 'dragon', label: 'Smok' },
            { id: 'xp', label: 'XP' },
            { id: 'team', label: 'Drużyna' },
            { id: 'current_field_name', label: 'Aktualne pole' },
            { id: 'next_field_name', label: 'Następne pole' },
            { id: 'login_count', label: 'Liczba aktywnych zalogowań' },
        ].map(field => (
            <div className="row">
                <div className="col-sm-4">
                    {`${field.label}:`}
                </div>
                <div className="col-sm-8">
                    {this.props.currentUser[field.id] || '-'}
                </div>
            </div>
            ));
    }

    render() {
        return (
            <div className="container bg-dark text-light">
                <h2 className="text-center">
                    Ustawienia i twoje dane
                </h2><br />
                <div className="user-settings-container">
                    <div className="row">
                        <div className="col-sm-4">
                            Nazwa użytkownika:
                        </div>
                        <div className="col-sm-8">
                            <input
                                type="text"
                                className="form-control bg-dark text-white"
                                value={this.state.usernameField}
                                onChange={e => this.handleField('usernameField', e)}
                                placeholder="Nazwa użytkownika"
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-4">
                            Hasło:
                        </div>
                        <div className="col-sm-8">
                            <input
                                type="password"
                                className="form-control bg-dark text-white"
                                value={this.state.passwordField}
                                onChange={e => this.handleField('passwordField', e)}
                                placeholder="Hasło bez zmian"
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-4">
                            Hasło ponownie:
                        </div>
                        <div className="col-sm-8">
                            <input
                                type="password"
                                className="form-control bg-dark text-white"
                                value={this.state.passwordField2}
                                onChange={e => this.handleField('passwordField2', e)}
                                placeholder="Hasło bez zmian"
                            />
                        </div>
                    </div>

                    {this.generateFields()}

                    <div className="row">
                        <div className="col-sm-2" />
                        <div className="col-sm-2">
                            <button
                                className="btn btn-outline-light btn-lg"
                                onClick={(e) => { e.preventDefault(); this.clearState(); }}
                            >
                                Anuluj
                            </button>
                        </div>
                        <div className="col-sm-4" />
                        <div className="col-sm-2">
                            <button
                                className="btn btn-outline-light btn-lg"
                                onClick={this.handleSubmit}
                            >
                                Zapisz
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}

UserSettings.propTypes = {
    currentUser: PropTypes.object.isRequired,
    databaseObjects: PropTypes.object.isRequired,
};
