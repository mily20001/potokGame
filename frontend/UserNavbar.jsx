import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Link,
} from 'react-router-dom';

import './User.scss';

export default class UserNavbar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            openDropdownId: '',
        };

        this.toggleDropdown = this.toggleDropdown.bind(this);
    }

    toggleDropdown(id) {
        if (this.state.openDropdownId === id) {
            this.setState({ openDropdownId: '' });
        } else {
            this.setState({ openDropdownId: id });
        }
    }

    render() {
        const tabList = [
            {
                title: 'Start',
                href: '/user',
            },
            {
                title: 'Przegląd',
                href: '/user/overview',
                subOptions: [
                    {
                        title: 'Przegląd smoków',
                        href: '/user/overview/dragons',
                    },
                    {
                        title: 'Przegląd punktów',
                        href: '/user/overview/points',
                    },
                    {
                        title: 'Przegląd drużyn',
                        href: '/user/overview/teams',
                    },
                    {
                        title: 'Przegląd graczy',
                        href: '/user/overview/players',
                    },
                ],
            },
            {
                title: 'Poprzednia tura',
                href: '/user/previous_turn',
            },
            {
                title: 'Mapa',
                href: '/user/map',
            },
        ];

        const tabs = tabList.map((tab) => {
            if (tab.subOptions && tab.subOptions.length) {
                const menuItems = tab.subOptions.map(option => (
                    <Link key={option.href} to={option.href}>{option.title}</Link>
                ));

                const currentTabActive =
                    document.location.pathname.substr(0, tab.href.length) === tab.href;

                return (
                    <div
                        className={`user-navbar-tab ${currentTabActive ? 'active' : 'text-white'}`}
                        onClick={() => this.toggleDropdown(tab.href)}
                        key={tab.href}
                    >
                        {tab.title}
                        {this.state.openDropdownId === tab.href &&
                            <div className="user-navbar-dropdown-list">
                                {menuItems}
                            </div>
                        }
                    </div>
                );
            }
            if (document.location.pathname === tab.href) {
                return (
                    <div className="user-navbar-tab active" key={tab.href}>
                        {tab.title}
                    </div>
                );
            }

            return (
                <Link to={tab.href} className="text-white user-navbar-tab" key={tab.href}>
                    {tab.title}
                </Link>
            );
        });

        return (
            <div className="navbar user-navbar">

                <Link to="/user" className="navbar-brand text-white">
                    {(this.props.width < 1100) ? 'DotU' : 'Dragons of the Universe'}
                </Link>

                <div className="user-navbar-tab-container">
                    {tabs}
                </div>

                <div className="user-name-container">
                    Witaj {this.props.username}!
                    <Link to="/user/settings">
                        <i className="fa fa-cog" />
                    </Link>
                    <i onClick={this.props.logout} className="fa fa-power-off" />
                </div>
            </div>
        );
    }
}

UserNavbar.propTypes = {
    username: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    logout: PropTypes.func.isRequired,
};
