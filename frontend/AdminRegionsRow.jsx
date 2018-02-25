import React from 'react';
import PropTypes from 'prop-types';

export default function AdminRegionsRow(props) {
    if (!props.isBeingEdited) {
        if (props.isEditable) {
            return (
                <tr>
                    <td>{props.regionName}</td>
                    <td>{props.regionDistance}</td>
                    <td
                        className="text-center"
                        onClick={props.onEdit}
                    >
                        <i className="fa fa-edit" />
                    </td>
                    <td
                        className="text-center"
                        onClick={props.onDelete}
                    >
                        <i className="fa fa-trash" />
                    </td>
                </tr>
            );
        }

        return (
            <tr>
                <td>{props.regionName}</td>
                <td>{props.regionDistance}</td>
            </tr>
        );
    }

    return (
        <tr>
            <td>
                <input
                    type="text"
                    value={props.regionName}
                    onChange={e => props.onValueChange('name', e.target.value)}
                    required
                />
            </td>
            <td>
                <input
                    type="number"
                    value={props.regionDistance}
                    onChange={e => props.onValueChange('distance', e.target.value)}
                    min="1"
                    max="100"
                    required
                />
            </td>
            <td
                className="text-center"
                onClick={props.onSave}
            >
                <i className="fa fa-check" />
            </td>
            <td
                className="text-center"
                onClick={props.onCancel}
            >
                <i className="fa fa-times" />
            </td>
        </tr>
    );
}

AdminRegionsRow.propTypes = {
    onValueChange: PropTypes.func,
    onEdit: PropTypes.func,
    onCancel: PropTypes.func,
    onSave: PropTypes.func,
    isEditable: PropTypes.bool,
    isBeingEdited: PropTypes.bool,
    regionName: PropTypes.string.isRequired,
    regionDistance: PropTypes.number.isRequired,
    onDelete: PropTypes.func,
};

AdminRegionsRow.defaultProps = {
    onEdit: () => {},
    onValueChange: () => {},
    onDelete: () => {},
    onSave: () => {},
    onCancel: () => {},
    isEditable: false,
    isBeingEdited: false,
};
