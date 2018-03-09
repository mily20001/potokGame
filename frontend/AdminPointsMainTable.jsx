import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './AdminPoints.scss';
import AdminPointsDateHeader from './AdminPointsDateHeader';

export default class AdminPointsMainTable extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const dataRows =
            this.props.dataArray.map((row, rowIndex) => {
                const cols = row.points.map((data, index) => {
                    if (!this.props.isEditable) {
                        return (<td>{data}</td>);
                    }

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
                        {isOngoing ? ' ' : data}
                    </td>);
                });
                return (
                    <tr
                        onMouseEnter={() => this.props.onMouseEnter(rowIndex)}
                        onMouseLeave={() => this.props.onMouseLeave(rowIndex)}
                    >
                        {cols}
                    </tr>
                );
            });

        return (
            <table className="table table-dark table-hover table-part">
                <thead>
                    <tr>
                        <AdminPointsDateHeader
                            date={this.props.headerDate}
                            isEditable={this.props.isEditable}
                            onDelete={() => this.props.onDateDelete(this.props.headerDate)}
                            onSave={(newDate) => {
                                this.props.onDateChange(this.props.headerDate, newDate);
                            }}
                        />
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
    dataArray: PropTypes.array.isRequired, // [[0, 1, 1, 1], [1, 1, 1, 1], ...]
    isEditable: PropTypes.bool,
    valuesOnEdit: PropTypes.func,
    changesList: PropTypes.object,
    ongoingChanges: PropTypes.object,
    savedChanges: PropTypes.object,
    onDateDelete: PropTypes.func,
    onDateChange: PropTypes.func,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
};

AdminPointsMainTable.defaultProps = {
    headerDate: undefined,
    isEditable: false,
    valuesOnEdit: () => {},
    changesList: [],
    ongoingChanges: {},
    savedChanges: {},
    dataArray: [],
    onDateDelete: () => {},
    onDateChange: () => {},
    onMouseEnter: () => {},
    onMouseLeave: () => {},
};
