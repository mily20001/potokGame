import React, { Component } from 'react';
import {
    BrowserRouter,
    Route,
    Link,
} from 'react-router-dom';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';

import './AdminWelcomePage.scss';

export default class AdminWelcomePage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            error: '',
        };
    }
    // componentDidMount() {
    //     document.title = 'Panel Administratora';
    // }
    render() {
        const { gameState } = this.props.databaseObjects.config;

        const gameStates = {
            BEFORE_ROUND: 'Poprzednia tura zakończona, należy wpisać punkty przed rozpoczęciem następnej tury',
            DURING_ROUND: 'Trwa tura, gracze wybierają swoje ruchy',
        };

        const btnTexts = {
            BEFORE_ROUND: 'Rozpocznij kolejną turę',
            DURING_ROUND: 'Zakończ i rozlicz aktualną turę',
        };

        const btnActions = {
            BEFORE_ROUND: () => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '/commit_points', true);
                xhr.onload = () => {
                    const result = JSON.parse(xhr.responseText);
                    if (result.ok !== undefined) {
                        this.props.databaseObjects.refreshDatabase('config');
                    } else {
                        this.setState({ error: result.err });
                    }
                };
                xhr.send();
            },
            DURING_ROUND: () => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '/finish_round', true);
                xhr.onload = () => {
                    const result = JSON.parse(xhr.responseText);
                    if (result.ok !== undefined) {
                        this.props.databaseObjects.refreshDatabase('config');
                        this.props.databaseObjects.refreshDatabase('users');
                    } else {
                        this.setState({ error: result.err });
                    }
                };
                xhr.send();
            },
        };

        const { error } = this.state;

        return (
            <div style={{ textAlign: 'center' }}>
                <h2>Aktualny stan gry: </h2>
                <h4>{gameStates[gameState]}</h4>
                {error && <Alert bsStyle="danger">{error.toString()}</Alert>}
                <button
                    className="btn btn-success main-btn"
                    // disabled={error}
                    onClick={btnActions[gameState]}
                >
                    {btnTexts[gameState]}
                </button>
            </div>
        );
    }
}

AdminWelcomePage.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
