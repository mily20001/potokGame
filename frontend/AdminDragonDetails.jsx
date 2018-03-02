import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './AdminDragons.scss';

export default class AdminDragonDetails extends Component {
    constructor() {
        super();
        this.state = {
            changes: {},
        };
    }

    render() {
        const levelTableRow = {
            xp: [<th>XP</th>],
            level: [<th>Poziom</th>],
            strength: [<th>Siła</th>],
            defence: [<th>Obrona</th>],
            range: [<th>Zasięg</th>],
            hp: [<th>Życie</th>],
            edit: [<th>Edytuj</th>],
            remove: [<th>Usuń</th>],
        };

        const dragon = this.props.dragon;

        Object.keys(dragon.levels).forEach((levelNumber) => {
            const level = { ...dragon.levels[levelNumber], level: levelNumber };

            Object.keys(level).forEach((key) => {
                levelTableRow[key].push(<td>{level[key]}</td>);
            });
            levelTableRow.edit.push(
                <td>
                    <i className="fa fa-edit" />
                </td>,
            );
            levelTableRow.remove.push(
                <td>
                    <i className="fa fa-trash" />
                </td>,
            );
        });

        return (
            <div className="dragon-details">
                <table className="table table-dark table-hover dragon-table">
                    <tbody>
                        {Object.keys(levelTableRow).map(rowId => <tr>{levelTableRow[rowId]}</tr>)}
                    </tbody>
                </table>
                <div className="dragon-details-new-level">
                    <i className="fa fa-plus" />
                </div>
            </div>
        );
    }
}

AdminDragonDetails.propTypes = {
    dragon: PropTypes.object.isRequired,
};
