import React, { Component } from 'react';
import prettyFormat from 'pretty-format';
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

    setError(err) {
        if (typeof err === 'string') {
            this.setState({ error: err });
        } else {
            this.setState({ error: prettyFormat(err) });
        }
    }

    render() {
        const { gameState, logToCommit } = this.props.databaseObjects.config;

        const gameStates = {
            BEFORE_ROUND: 'Poprzednia tura zakończona, należy wpisać punkty przed rozpoczęciem następnej tury',
            DURING_ROUND: 'Trwa tura, gracze wybierają swoje ruchy',
            DURING_COMMIT: 'Tura zakończona, oczekiwanie na zatwierdzenie zmian',
        };

        const btnTexts = {
            BEFORE_ROUND: 'Rozpocznij kolejną turę',
            DURING_ROUND: 'Zakończ i rozlicz aktualną turę',
            DURING_COMMIT: 'Zatwierdź zmiany',
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
                        this.setError(result.err);
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
                        this.setError(result.err);
                    }
                };
                xhr.send();
            },
            DURING_COMMIT: () => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '/commit_changes_and_log', true);
                xhr.onload = () => {
                    const result = JSON.parse(xhr.responseText);
                    if (result.ok !== undefined) {
                        this.props.databaseObjects.refreshDatabase('config');
                        this.props.databaseObjects.refreshDatabase('users');
                    } else {
                        this.setError(result.err);
                    }
                };
                xhr.send();
            },
        };

        let history = '';

        if (gameState === 'DURING_COMMIT') {
            try {
                history = JSON.parse(logToCommit).join('\n');
            } catch (e) {
                history = prettyFormat(e);
            }
        }

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
                {gameState === 'DURING_COMMIT' &&
                    <div className="hist-box">
                        <h5>Historia do zatwierdzenia:</h5>
                        <pre>{history}</pre>
                    </div>
                }
            </div>
        );
    }
}

AdminWelcomePage.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
