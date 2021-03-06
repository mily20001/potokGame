import React from 'react';
import PropTypes from 'prop-types';

import './AdminDragons.scss';

import AdminDragonImage from './AdminDragonImage';

export default function AdminDragonPreview(props) {
    let imageList;

    if (props.isEditable) {
        imageList = Object.keys(props.databaseObjects.images).map((id) => {
            if (props.databaseObjects.images[id].type !== 'dragon') {
                return undefined;
            }

            return (
                <div className="dragon-dropdown-element" onClick={() => props.changeImage(id)}>
                    <AdminDragonImage
                        imageId={parseInt(id, 10)}
                    />
                    {props.databaseObjects.images[id].filename}
                </div>
            );
        }).filter(row => row !== undefined);
    }

    const imageId = props.databaseObjects.dragons[props.dragonId]
        && props.databaseObjects.dragons[props.dragonId].image
        && parseInt(props.databaseObjects.dragons[props.dragonId].image, 10);

    return (
        <div className="dragon-preview-container">
            <div className="dragon-preview">
                <AdminDragonImage
                    imageId={imageId === null ? undefined : imageId}
                    // forceLoad={props.isBeingUpdated}
                />
            </div>
            {props.isEditable &&
                <div className="dragon dropdown">
                    <button className="dragon dropbtn">Zmień obrazek</button>
                    <div className="dragon dropdown-content">
                        {imageList}
                    </div>
                </div>
            }
        </div>
    );
}

AdminDragonPreview.propTypes = {
    databaseObjects: PropTypes.object.isRequired,
    dragonId: PropTypes.number.isRequired,
    changeImage: PropTypes.func,
    isBeingUpdated: PropTypes.bool,
    isEditable: PropTypes.bool,
};

AdminDragonPreview.defaultProps = {
    changeImage: () => {},
    isBeingUpdated: false,
    isEditable: false,
};
