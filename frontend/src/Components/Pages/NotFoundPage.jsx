import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../Styles/NotFoundPage.module.css';

const NotFoundPage = () => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.errorCode}>404</h1>
                <h2 className={styles.title}>Offside!</h2>
                <p className={styles.description}>
                    It looks like you've wandered out of position.
                    The page you are looking for doesn't exist or has been transferred to another league.
                </p>

                <Link to="/" className={styles.homeButton}>
                    Return to Pitch
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;