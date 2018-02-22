import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Popup from 'react-popup';

import './AdminPoints.scss';

function zeroPad(a) {
    return `0${a}`.slice(-2);
}

export default class AdminPointsDateHeader extends Component {
    constructor(props) {
        super(props);

        this.state = {
            hovered: false,
            isBeingChanged: false,
            changedDate: undefined,
        };

        this.startEdit = this.startEdit.bind(this);
        this.save = this.save.bind(this);
        this.cancel = this.cancel.bind(this);
        this.handleDateChange = this.handleDateChange.bind(this);
        this.deleteDate = this.deleteDate.bind(this);
    }

    startEdit() {
        let date;
        if (isFinite((new Date(this.props.date)).valueOf())) {
            date = this.props.date;
        } else {
            date = new Date();
        }
        this.setState({ isBeingChanged: true, changedDate: date });
    }

    save() {
        if ((new Date(this.props.date)).valueOf()
            !== (new Date(this.state.changedDate)).valueOf()
        ) {
            this.props.onSave(this.state.changedDate);
        }
        this.setState({ isBeingChanged: false, changedDate: undefined });
    }

    cancel() {
        this.setState({ isBeingChanged: false, changedDate: undefined });
    }

    handleDateChange(e) {
        if (isFinite((new Date(e.target.value)).valueOf())) {
            this.setState({ changedDate: e.target.value });
        }
    }

    deleteDate() {
        const tmpDate = new Date(this.props.date);
        if (isNaN(tmpDate.valueOf())) {
            return;
        }
        const parsedDate = `${tmpDate.getDate()}.${zeroPad(tmpDate.getMonth() + 1)}.${tmpDate.getFullYear()}`;
        Popup.create({
            title: 'Potwierdzenie',
            content: `Czy na pewno chcesz usunąć punkty WSZYSTKICH graczy z dnia ${parsedDate}?`,
            buttons: {
                left: [{
                    text: 'Anuluj',
                    action: Popup.close,
                }],
                right: [{
                    text: 'Usuń',
                    className: 'danger',
                    action: () => { this.props.onDelete(); Popup.close(); },
                }],
            },
        });
    }

    render() {
        if (!this.props.isEditable) {
            const tmpDate = new Date(this.props.date);
            const parsedDate = `${tmpDate.getDate()}.${zeroPad(tmpDate.getMonth() + 1)}.${tmpDate.getFullYear()}`;
            return (
                <th
                    colSpan={4}
                    className="date-header date-header"
                >
                    {parsedDate}
                </th>
            );
        }

        const hasDate = isFinite((new Date(this.props.date)).valueOf());

        if (this.state.isBeingChanged) {
            const tmpDate = new Date(this.state.changedDate);
            const parsedDate = `${tmpDate.getFullYear()}-${zeroPad(tmpDate.getMonth() + 1)}-${zeroPad(tmpDate.getDate())}`;
            console.log(parsedDate);
            if (hasDate) {
                return (
                    <th colSpan={4} className="date-header date-header-editing">
                        <i onClick={this.cancel} className="date-header-button fa fa-times" />
                        <input type="date" onChange={this.handleDateChange} value={parsedDate} />
                        {(hasDate &&
                        <i
                            onClick={this.save}
                            className="date-header-button fa fa-check"
                        />
                        ) ||
                        <i
                            onClick={() => this.setState({ isBeingChanged: false })}
                            className="date-header-button fa fa-check"
                        />
                        }
                    </th>
                );
            }

            return (
                <th colSpan={4} className="date-header date-header-editing">
                    <i onClick={this.cancel} className="date-header-button fa fa-times" />
                    <input type="date" onChange={this.handleDateChange} value={parsedDate} />
                    <i
                        onClick={() => this.setState({ isBeingChanged: false })}
                        className="date-header-button fa fa-check"
                    />
                </th>
            );
        }

        if (hasDate) {
            const tmpDate = new Date(this.props.date);
            const parsedDate = `${tmpDate.getDate()}.${zeroPad(tmpDate.getMonth() + 1)}.${tmpDate.getFullYear()}`;
            return (
                <th
                    colSpan={4}
                    className="date-header date-header-editable"
                    onMouseEnter={() => this.setState({ hovered: true })}
                    onMouseLeave={() => this.setState({ hovered: false })}
                >
                    {this.state.hovered &&
                        <i onClick={this.deleteDate} className="date-header-button fa fa-trash" />
                    }
                    {parsedDate}
                    {this.state.hovered &&
                        <i onClick={this.startEdit} className="date-header-button fa fa-edit" />
                    }
                </th>
            );
        }

        // TODO add cancel event to props
        if (this.state.changedDate !== undefined) {
            const tmpDate = new Date(this.state.changedDate);
            const parsedDate = `${tmpDate.getDate()}.${zeroPad(tmpDate.getMonth() + 1)}.${tmpDate.getFullYear()}`;
            return (
                <th
                    colSpan={4}
                    className="date-header date-header-editable"
                >
                    <i onClick={this.cancel} className="date-header-button fa fa-trash" />
                    {parsedDate}
                    <i onClick={this.save} className="date-header-button fa fa-save" />
                </th>
            );
        }

        return (
            <th
                colSpan={4}
                className="date-header date-header-null-editable"
                onClick={this.startEdit}
            >
                <i className="fa fa-plus" />
            </th>
        );
    }
}

AdminPointsDateHeader.propTypes = {
    date: PropTypes.object,
    isEditable: PropTypes.bool,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
};

AdminPointsDateHeader.defaultProps = {
    date: undefined,
    isEditable: false,
    onSave: () => {},
    onDelete: () => {},
};
