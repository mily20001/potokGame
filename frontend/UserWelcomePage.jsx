import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './User.scss';

function getSafeVal(val) {
    return val || (val === 0 ? '0' : '');
}

export default class UserWelcomePage extends Component {
    generateFields() {
        const fields = [];
        const { gameState } = this.props.databaseObjects.config;

        const user = this.props.currentUser;
        const level = user.dragonLevel || {};

        const gameStates = {
            BEFORE_ROUND: 'Poprzednia tura zakończona, trwa wpisywanie punktów przed rozpoczęciem następnej tury',
            DURING_ROUND: 'Trwa tura, gracze wybierają swoje ruchy',
            DURING_COMMIT: 'Tura zakończona, oczekiwanie na zatwierdzenie zmian',
        };

        fields.push(
            { id: 'hp', label: 'HP' },
            { id: 'gold', label: 'Złoto' },
            { id: 'dragon', label: 'Smok' },
            { id: 'dragon_level', label: 'Poziom smoka', value: level.level },
            { id: 'dragon_range', label: 'Zasięg', value: level.range },
            { id: 'dragon_strength', label: 'Siła', value: level.strength },
            { id: 'dragon_defence', label: 'Obrona', value: level.defence },
            { id: 'dragon_hp', label: 'Max HP', value: level.hp },
            { id: 'xp', label: 'XP' },
            { id: 'last_xp_gain', label: 'Ostatnio zdobyte XP' },
            { id: 'is_resping', label: 'Stan', value: user.is_resping ? 'W trakcie respienia' : 'Żywy' },
            { id: 'team', label: 'Drużyna' },
            { id: 'current_field_name', label: 'Aktualne pole' },
            { id: 'next_field_name', label: 'Następne pole' },
            { id: 'game_state', label: 'Aktualny stan gry', value: gameStates[gameState] });

        return fields.map(field => (
            <div className="row user-welcome-info-row">
                <div className="col-sm-3 offset-sm-4">
                    {`${field.label}:`}
                </div>
                <div className="col-sm-5">
                    {getSafeVal(field.value) || getSafeVal(user[field.id]) || '-'}
                </div>
            </div>
        ));
    }

    render() {
        return (
            <div className="container bg-dark text-light">
                <h2 className="text-center">
                    Aktualny status
                </h2><br />
                <div >
                    {this.generateFields()}
                </div>
            </div>
        );
    }
}

UserWelcomePage.propTypes = {
    currentUser: PropTypes.object.isRequired,
    databaseObjects: PropTypes.object.isRequired,
};
