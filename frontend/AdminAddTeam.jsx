import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SliderPicker } from 'react-color';

import './AdminTeams.scss';

export default class AdminAddTeam extends Component {
    constructor(props) {
        super(props);

        this.cleanState = {
            name: '',
            capitan: '',
            color: '',
        };

        this.state = {
            ...this.cleanState,
            ...this.props.currentTeam,
            editingTeam: Object.keys(this.props.currentTeam).length !== 0,
            status: -1,
        };

        this.handleField = this.handleField.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.clearState = this.clearState.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ ...this.cleanState,
            id: undefined,
            ...nextProps.currentTeam,
            editingTeam: Object.keys(nextProps.currentTeam).length !== 0 });
    }

    clearState() {
        this.setState({ ...this.cleanState, id: undefined });
    }

    handleField(fieldName, event) {
        this.setState({ [fieldName]: event.target.value });
    }

    handleSubmit(e) {
        e.preventDefault();

        const data = new FormData();

        this.fieldsArr.forEach((key) => {
            data.append(key, this.state[key]);
        });

        // console.log('editing:', this.state.editingUser);

        if (this.state.editingTeam) {
            data.append('id', this.state.id);
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/add_team', true);
        xhr.onload = () => {
            console.log(xhr.responseText);
            const uploadResponse = JSON.parse(xhr.responseText);
            if (uploadResponse.ok !== undefined) {
                this.setState({ status: 0 });
                this.props.databaseObjects.refreshDatabase('teams');
                this.props.finishEdit();
            } else {
                this.setState({ status: 3 });
            }
        };
        xhr.send(data);
        this.setState({ status: -1 });
    }

    prepareForm() {
        const obligatoryFields = ['name', 'color'];

        const fields = [
            { id: 'name', placeholder: 'Wpisz nazwę drużyny', label: 'Nazwa drużyny:', type: 'text' },
            { id: 'color', label: 'Kolor drużyny:', type: 'color' },
            { id: 'capitan',
                label: 'Kapitan drużyny:',
                type: 'dropdown',
                placeholder: 'Wybierz kapitana',
                options: Object.keys(this.props.databaseObjects.users)
                    .filter(key => this.props.databaseObjects.users[key].role === 'player')
                    .map((key) => {
                        const user = this.props.databaseObjects.users[key];
                        return [key, `${user.name} ${user.surname}`];
                    }),
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
                        <label
                            className="control-label col-sm-4 col-lg-12 col-xl-4"
                            htmlFor={field.id}
                        >
                            {field.label}
                        </label>
                        <div className="col-sm-8 col-lg-12 col-xl-8">
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

            if (field.type === 'color') {
                return (
                    <div className="form-group row">
                        <label
                            className="control-label col-sm-4 col-lg-12 col-xl-4"
                            htmlFor={field.id}
                        >
                            {field.label}
                        </label>
                        <div className="col-sm-8 col-lg-12 col-xl-8">
                            <div
                                className="color-preview-div"
                                style={{
                                    backgroundColor: this.state.color,
                                    height: this.state.color === '' ? '0px' : undefined,
                                }}
                            />
                            <SliderPicker
                                color={this.state.color}
                                onChange={color => this.setState({ color: color.hex })}
                            />
                        </div>
                    </div>
                );
            }
            return (
                <div className="form-group row">
                    <label className="control-label col-sm-4 col-lg-12 col-xl-4" htmlFor={field.id}>
                        {field.label}
                    </label>
                    <div className="col-sm-8 col-lg-12 col-xl-8">
                        <input
                            type={field.type}
                            className="form-control bg-dark text-white"
                            id={field.id}
                            name={field.id}
                            onChange={e => this.handleField(field.id, e)}
                            value={this.state[field.id]}
                            placeholder={field.placeholder}
                            required={!this.state.editingUser
                                && obligatoryFields.indexOf(field.id) !== -1}
                        />
                    </div>
                </div>
            );
        });
    }

    render() {
        this.prepareForm();
        return (
            <div className="container bg-dark text-light">
                <h2 className="text-center">
                    {Object.keys(this.props.currentTeam).length === 0 ? 'Dodaj nową drużynę' : 'Modyfikuj istniejącą drużynę'}
                </h2><br />
                {this.state.status === 0 &&
                    <div className="alert alert-success">Zmiany zapisane</div>
                }
                {this.state.status === 1 &&
                    <div className="alert alert-danger">Uzupełnij brakujące pola</div>
                }
                {this.state.status === 3 &&
                    <div className="alert alert-danger">Zmiany nie zostały zapisane</div>
                }
                <form className="form-horizontal" onSubmit={this.handleSubmit}>
                    {this.formFields}
                    <div className="row">
                        <div className="col-sm-2" />
                        <div className="col-sm-2">
                            <button
                                className="btn btn-outline-light btn-lg"
                                onClick={(e) => { e.preventDefault(); this.props.finishEdit(); }}
                            >
                                Anuluj
                            </button>
                        </div>
                        <div className="col-sm-4" />
                        <div className="col-sm-2">
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

AdminAddTeam.propTypes = {
    currentTeam: PropTypes.object,
    databaseObjects: PropTypes.object.isRequired,
    finishEdit: PropTypes.func.isRequired,
};

AdminAddTeam.defaultProps = {
    currentTeam: {},
};
