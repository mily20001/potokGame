import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './AdminDragons.scss';

export default class AdminDragonImage extends Component {
    constructor() {
        super();
        this.state = {
            status: 'loading',
        };

        this.setReady = this.setReady.bind(this);
    }

    setReady() {
        this.setState({ status: 'ready' });
    }

    render() {
        const { status } = this.state;
        const { forceLoad, imageId } = this.props;

        const loading = status === 'loading' || forceLoad;

        const displayWhileReady = {
            ...(loading && { display: 'none ' }),
        };

        const displayWhileLoading = {
            ...(!loading && { display: 'none ' }),
        };

        if (imageId === undefined) {
            return (
                <div className="dragon-image">
                    <i className="fa fa-times-circle" style={{ fontSize: '40px' }} />
                </div>
            );
        }

        return (
            <div className="dragon-image">
                <div style={displayWhileLoading} className="image-loader-anim dragon-image">
                    <div className="rect1" />
                    <div className="rect2" />
                    <div className="rect3" />
                    <div className="rect4" />
                    <div className="rect5" />
                </div>

                <div style={displayWhileReady} className="dragon-image">
                    <img src={`/get_image?id=${imageId}`} alt="dragon" onLoad={this.setReady} />
                </div>
            </div>
        );
    }
}

AdminDragonImage.propTypes = {
    imageId: PropTypes.number,
    forceLoad: PropTypes.bool,
};

AdminDragonImage.defaultProps = {
    imageId: undefined,
    forceLoad: false,
};
