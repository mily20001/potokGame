import React from 'react';
import PropTypes from 'prop-types';
import {
    Link,
} from 'react-router-dom';

import './User.scss';

export default function UserNavbar(props) {
    const tabList = [
        {
            title: 'Przegląd smoków',
            href: '/user/dragons',
        },
        {
            title: 'Przegląd punktów',
            href: '/user/points',
        },
        {
            title: 'Przegląd drużyn',
            href: '/user/teams',
        },
        {
            title: 'Przegląd graczy',
            href: '/user/players',
        },
    ];

    const tabs = tabList.map((tab) => {
        if (document.location.pathname === tab.href) {
            return (
                <div className="user-navbar-tab active">
                    {tab.title}
                </div>
            );
        }

        return (
            <Link to={tab.href} className="text-white user-navbar-tab">
                {tab.title}
            </Link>
        );
    });

    return (
        <div className="navbar user-navbar">

            <Link to="/user" className="navbar-brand text-white">
                {(props.width < 600) ? 'DotU' : 'Dragons of the Universe'}
            </Link>

            <div className="user-navbar-tab-container">
                {tabs}
            </div>

            <div className="user-name-container">
                Witaj {props.username}!
                <Link to="/user/settings">
                    <i className="fa fa-cog" />
                </Link>
                <i onClick={props.logout} className="fa fa-power-off" />
            </div>
        </div>
    );
}

UserNavbar.propTypes = {
    username: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    logout: PropTypes.func.isRequired,
};
