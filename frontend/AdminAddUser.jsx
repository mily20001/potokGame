import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './FileUploader.scss';

export default class AdminAddUser extends Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            name: '',
            surname: '',
            password: '',
            password2: '',
            dragon: '',
            team: '',
            hp: -1,
            role: 'player',
            currentField: -1,
            nextField: -1,
            status: -1,
        };

        this.state = { ...this.state, ...this.props.currentUser };

        this.handleField = this.handleField.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleField(fieldName, event) {
        console.log(fieldName, event.target.value);
        this.setState({ [fieldName]: event.target.value });
    }

    handleSubmit(e) {
        e.preventDefault();

        if (this.state.password !== this.state.password2) {
            this.setState({ status: 2 });
            return;
        }

        const data = new FormData();

        this.fieldsArr.forEach((key) => {
            if (this.state[key] !== '' && this.state[key] !== -1) {
                data.append(key, this.state[key]);
            }
        });

        // TODO handle modifying user
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/add_user', true);
        xhr.onload = () => {
            console.log(xhr.responseText);
            const uploadResponse = JSON.parse(xhr.responseText);
            if (uploadResponse.ok !== undefined) {
                this.setState({ status: 0 });
            } else {
                this.setState({ status: 3 });
            }
        };
        xhr.send(data);
        this.setState({ status: -1 });
    }

    prepareForm() {
        const obligatoryFields = ['username', 'name', 'surname', 'password', 'password2', 'role'];

        const fields = [
            { id: 'username', placeholder: 'Wpisz nazwę użytkownika', label: 'Nazwa użytkownika', type: 'text' },
            { id: 'name', placeholder: 'Wpisz imię użytkownika', label: 'Imię użytkownika', type: 'text' },
            { id: 'surname', placeholder: 'Wpisz nazwisko użytkownika', label: 'Nazwisko użytkownika', type: 'text' },
            { id: 'password', placeholder: 'Wpisz hasło', label: 'Hasło', type: 'password' },
            { id: 'password2', placeholder: 'Wpisz ponownie hasło', label: 'Hasło (ponownie)', type: 'password' },
            { id: 'role',
                label: 'Funkcja użytkownika',
                type: 'dropdown',
                options: [['player', 'Gracz'], ['admin', 'Administrator']],
            },
            { id: 'dragon',
                label: 'Smok użytkownika',
                type: 'dropdown',
                placeholder: 'Wybierz smoka',
                options: Object.keys(this.props.databaseObjects.dragons).map(key =>
                    [key, this.props.databaseObjects.dragons[key].name]),
            },
            { id: 'team',
                label: 'Drużyna użytkownika',
                type: 'dropdown',
                placeholder: 'Wybierz drużynę',
                options: Object.keys(this.props.databaseObjects.teams).map(key =>
                    [key, this.props.databaseObjects.teams[key].name]),
            },
        ];

        this.fieldsArr = fields.map(field => field.id);

        this.formFields = fields.map((field) => {
            if (field.type === 'dropdown') {
                const options = field.options.map(option => (
                    <option
                        value={option[0]}
                    >
                        {option[1]}
                    </option>
                ));

                if (field.placeholder !== undefined) {
                    options.push(<option value="" disabled hidden>{field.placeholder}</option>);
                }

                return (
                    <div className="form-group row">
                        <label className="control-label col-sm-2" htmlFor={field.id}>
                            {field.label}
                        </label>
                        <div className="col-sm-10">
                            <select
                                className="form-control bg-dark text-white"
                                id={field.id}
                                onChange={e => this.handleField(field.id, e)}
                                value={this.state[field.id]}
                            >
                                {options}
                            </select>
                        </div>
                    </div>
                );
            }
            return (
                <div className="form-group row">
                    <label className="control-label col-sm-2" htmlFor={field.id}>
                        {field.label}
                    </label>
                    <div className="col-sm-10">
                        <input
                            type={field.type}
                            className="form-control bg-dark text-white"
                            id={field.id}
                            name={field.id}
                            onChange={e => this.handleField(field.id, e)}
                            value={this.state[field.id]}
                            placeholder={field.placeholder}
                            required={obligatoryFields.indexOf(field.id) !== -1}
                        />
                    </div>
                </div>
            );
        });
    }

    render() {
        this.prepareForm();
        return (
            <div className="container bg-dark text-light file-upload-container">
                <h2 className="text-center">
                    {Object.keys(this.props.currentUser).length === 0 ? 'Dodaj nowego użytkownika' : 'Modyfikuj istniejącego użytkownika'}
                </h2><br />
                {this.state.status === 0 &&
                    <div className="alert alert-success">Zmiany zapisane</div>
                }
                {this.state.status === 1 &&
                    <div className="alert alert-danger">Uzupełnij brakujące pola</div>
                }
                {this.state.status === 2 &&
                    <div className="alert alert-danger">Podane hasła nie zgadzają się</div>
                }
                {this.state.status === 3 &&
                    <div className="alert alert-danger">Zmiany nie zostały zapisane</div>
                }
                <form className="form-horizontal" onSubmit={this.handleSubmit}>
                    {this.formFields}
                    <div className="form-group">
                        <div className="col-sm-offset-2 col-sm-10">
                            <button
                                type="submit"
                                className="btn btn-outline-light btn-lg"
                            >
                                Zapisz
                            </button>
                        </div>
                    </div>
                </form>
            </div>

        );
    }
}

AdminAddUser.propTypes = {
    currentUser: PropTypes.object,
    databaseObjects: PropTypes.object.isRequired,
};

AdminAddUser.defaultProps = {
    currentUser: {},
};
