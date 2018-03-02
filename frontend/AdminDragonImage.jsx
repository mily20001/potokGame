import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './AdminDragons.scss';

export default class AdminDragonImage extends Component {
    constructor() {
        super();
        this.state = {
            status: 'loading',
            data: undefined,
        };
    }

    componentDidMount() {
        if (this.props.imageId === undefined) {
            return;
        }

        this.props.getImage(this.props.imageId, (data, dataType) => {
            let imgString = `${dataType};base64,`;
            imgString += btoa(String.fromCharCode.apply(null, (new Buffer(data.data))));

            this.setState({ status: 'ready', data: imgString });
        });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.imageId === undefined) {
            return;
        }

        this.setState({ status: 'loading' });

        nextProps.getImage(nextProps.imageId, (data, dataType) => {
            let imgString = `${dataType};base64,`;
            imgString += btoa(String.fromCharCode.apply(null, (new Buffer(data.data))));

            this.setState({ status: 'ready', data: imgString });
        });
    }

    render() {
        if (this.props.imageId === undefined) {
            return (
                <div className="dragon-image">
                    <i className="fa fa-times-circle" style={{ fontSize: '40px' }} />
                </div>
            );
        }

        if (this.state.status === 'loading') {
            return (
                <div className="image-loader-anim dragon-image">
                    <div className="rect1" />
                    <div className="rect2" />
                    <div className="rect3" />
                    <div className="rect4" />
                    <div className="rect5" />
                </div>
            );
        }

        return (
            <div className="dragon-image">
                <img src={this.state.data} alt="dragon" />
            </div>
        );
    }
}

AdminDragonImage.propTypes = {
    imageId: PropTypes.number,
    getImage: PropTypes.func.isRequired,
};

AdminDragonImage.defaultProps = {
    imageId: undefined,
};
