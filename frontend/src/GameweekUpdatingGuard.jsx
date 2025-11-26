import React, { useState, useEffect, useRef } from 'react';
import { fetchSystemStatus } from './services/systemService';
import Style from './Styles/GameweekUpdating.module.css';


const MIN_DISPLAY_TIME = 2 * 60 * 1000;

const GameweekUpdatingGuard = ({ children }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const lockStartTimeRef = useRef(null);

    useEffect(() => {
        let intervalId;

        const checkStatus = async () => {
            const isBackendLocked = await fetchSystemStatus();
            const now = Date.now();

            if (isBackendLocked) {
                setIsUpdating(true);

                if (lockStartTimeRef.current === null) {
                    lockStartTimeRef.current = now;
                    console.log("System update detected. Timer started.");
                }
            } else {
                if (lockStartTimeRef.current !== null) {
                    const timePassed = now - lockStartTimeRef.current;

                    if (timePassed < MIN_DISPLAY_TIME) {
                        const remaining = (MIN_DISPLAY_TIME - timePassed) / 1000;
                        console.log(`Backend ready, but keeping screen for realism. Remaining: ${remaining.toFixed(0)}s`);
                        setIsUpdating(true);
                    } else {
                        console.log("Update complete and minimum time passed. Unlocking.");
                        setIsUpdating(false);
                        lockStartTimeRef.current = null;
                    }
                } else {
                    setIsUpdating(false);
                }
            }
        };

        checkStatus();

        intervalId = setInterval(checkStatus, 5000);

        return () => clearInterval(intervalId);
    }, []);

    if (isUpdating) {
        return (
            <div className={Style.container}>
                <div className={Style.spinner}></div>
                <h2 className={Style.title}>Season Update in Progress</h2>
                <p className={Style.message}>
                    We are currently processing the gameweek rollover, updating points, and finalizing squads.
                    <br />
                    This process ensures all data remains consistent.
                </p>
                <div className={Style.badge}>PLEASE WAIT...</div>
            </div>
        );
    }

    return <>{children}</>;
};

export default GameweekUpdatingGuard;