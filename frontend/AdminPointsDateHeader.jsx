import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class AdminPointsDateHeader extends Component {
    constructor(props) {
        super(props);

        this.state = {
            hovered: false,
            isBeingChanged: false,
            changedDate: undefined,
        };
    }

    render() {
        const hasDate = isFinite((new Date(this.props.date)).valueOf());

        if (hasDate) {
            const tmpDate = new Date(this.props.date);
            const parsedDate = `${tmpDate.getDate()}.${`0${(tmpDate.getMonth() + 1)}`.slice(-2)}.${tmpDate.getFullYear()}`;
            return (
                <th colSpan={4}>
                    {parsedDate}
                </th>
            );
        }

        return (
            <th colSpan={4}>
                +
            </th>
        );
    }
}

AdminPointsDateHeader.propTypes = {
    date: PropTypes.object,
    isDeletable: PropTypes.bool,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
};

AdminPointsDateHeader.defaultProps = {
    date: undefined,
    isDeletable: false,
    onSave: () => {},
    onDelete: () => {},
};
