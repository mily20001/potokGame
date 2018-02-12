import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactRouterPropTypes from 'react-router-prop-types';

export default class Login extends Component {
    componentDidMount() {
        console.log(this.props.history);
    }
    render() {
        return (
            <div className="container">
                Hello Login!
            </div>
        );
    }
}

Login.propTypes = {
    setUser: PropTypes.function.isRequired,
    history: ReactRouterPropTypes.history.isRequired,
};

