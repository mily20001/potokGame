import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './AdminPoints.scss';

export default class AdminPointsMainTable extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const dataRows =
            this.props.dataArray.map((row) => {
                const cols = row.points.map((data, index) => {
                    let className = '';

                    const isChanged = (this.props.changesList[row.id]
                        && this.props.changesList[row.id][index]) || false;

                    const isOngoing = (this.props.ongoingChanges[row.id]
                        && this.props.ongoingChanges[row.id][index]) || false;

                    const isSaved = (this.props.savedChanges[row.id]
                        && this.props.savedChanges[row.id][index]) || false;

                    if (isOngoing) {
                        className = 'points-ongoing';
                    } else if (isChanged) {
                        className = 'points-changed';
                    } else if (isSaved) {
                        className = 'points-saved';
                    }

                    return (<td
                        onDoubleClick={() => this.props.valuesOnEdit(row.id, index)}
                        className={className}
                    >
                        {data}
                    </td>);
                });
                return (<tr>{cols}</tr>);
            });

        return (
            <table className="table table-dark table-hover table-part">
                <thead>
                    <tr>
                        <th colSpan={4}>{this.props.headerDate}</th>
                    </tr>
                    <tr>
                        <th>P</th>
                        <th>Pr</th>
                        <th>S</th>
                        <th>E</th>
                    </tr>
                </thead>
                <tbody>
                    {dataRows}
                </tbody>
            </table>
        );
    }
}

AdminPointsMainTable.propTypes = {
    headerDate: PropTypes.object.isRequired,
    headerDateEditable: PropTypes.bool,
    dataArray: PropTypes.array.isRequired, // [[0, 1, 1, 1], [1, 1, 1, 1], ...]
    valuesEditable: PropTypes.bool,
    valuesOnEdit: PropTypes.func,
    changesList: PropTypes.object,
    ongoingChanges: PropTypes.object,
    savedChanges: PropTypes.object,
};

AdminPointsMainTable.defaultProps = {
    headerDateEditable: false,
    valuesEditable: false,
    valuesOnEdit: () => {},
    changesList: [],
    ongoingChanges: {},
    savedChanges: {},
};
