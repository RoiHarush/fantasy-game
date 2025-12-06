import React from 'react';
import Style from '../../../Styles/Status.module.css';

function DailyStatusTable({ dailyStatus, isGameweekFinished }) {

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    return (
        <div className={Style.dailyTableContainer}>
            <div className={Style.tableHeader}>
                <span>Day</span>
                <span>Match Points</span>
            </div>

            <div className={Style.tableRows}>
                {dailyStatus.map((day, index) => (
                    <div key={index} className={Style.tableRow}>
                        <div className={Style.dateCell}>
                            {formatDate(day.date)}
                        </div>
                        <div className={Style.statusCell}>
                            {day.isCalculated ? (
                                <span className={Style.pointsAdded}>Points Added</span>
                            ) : (
                                <span className={Style.liveText}>LIVE</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className={`${Style.summaryBar} ${isGameweekFinished ? Style.summaryFinal : Style.summaryLive}`}>
                {isGameweekFinished ? (
                    <>
                        <span>Gameweek Finished</span>
                        <span className={Style.badge}>UPDATED</span>
                    </>
                ) : (
                    <>
                        <span>Gameweek in Progress</span>
                        <span className={Style.badge}>LIVE</span>
                    </>
                )}
            </div>
        </div>
    );
}

export default DailyStatusTable;