import React from 'react';

export default function Footer() {
    return (
        <footer style={{
            textAlign: 'center',
            padding: '20px',
            fontSize: '0.8rem',
            color: '#6b7280',
            marginTop: 'auto',
            borderTop: '1px solid #e5e7eb'
        }}>
            <p>
                Fantasy Draft Project © {new Date().getFullYear()} By Roi Harush
            </p>
            <p style={{ fontSize: '0.7rem', marginTop: '5px' }}>
                This is an educational project. Not affiliated with the Premier League.
            </p>
        </footer>
    );
}