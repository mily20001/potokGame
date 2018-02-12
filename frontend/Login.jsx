import React, { Component } from 'react';
import {
    BrowserRouter,
    Route,
    Link,
} from 'react-router-dom';

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
