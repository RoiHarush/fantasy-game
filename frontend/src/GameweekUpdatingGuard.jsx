import React from 'react';
import Style from './Styles/GameweekUpdating.module.css';
import { useSystemStatus } from './Context/SystemStatusContext';

const GameweekUpdatingGuard = ({ children }) => {
    const { isSystemLocked } = useSystemStatus();

    if (isSystemLocked) {
        return (
            <div className={Style.container}>
                <div className={Style.spinner}></div>
                <h2 className={Style.title}>Season Update in Progress</h2>
                <p className={Style.message}>
                    We are currently processing the gameweek rollover...
                </p>
                <div className={Style.badge}>PLEASE WAIT...</div>
            </div>
        );
    }

    return <>{children}</>;
};

export default GameweekUpdatingGuard;