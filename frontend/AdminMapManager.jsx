import React, { Component } from 'react';
import PropTypes from 'prop-types';

import MapFieldComponent from './MapFieldComponent';
import MapComponent from "./MapComponent";

export default class AdminMapManager extends Component {
    constructor(props) {
        super(props);

        this.state = {
            fields: {
                11: {
                    x: 0,
                    y: 0,
                },

                12: {
                    x: 0,
                    y: 0,
                },
            },
        };
    }

    move(fieldId, dx, dy) {
        const movedField = {
            x: dx + this.state.fields[fieldId].x,
            y: dy + this.state.fields[fieldId].y,
        };

        console.log(movedField.x, movedField.y);

        this.setState({ fields: { ...this.state.fields, [fieldId]: movedField } });
    }

    render() {
        return (
            <div>
                <MapComponent databaseObjects={this.props.databaseObjects} isEditable />
            </div>
        );
    }
}

AdminMapManager.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
};
