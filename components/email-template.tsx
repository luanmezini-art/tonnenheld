import * as React from 'react';

interface EmailTemplateProps {
    customerName: string;
    customerAddress: string;
    binType: string;
    serviceDate: string;
    serviceScope: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
    customerName,
    customerAddress,
    binType,
    serviceDate,
    serviceScope,
}) => (
    <div style={{ fontFamily: 'sans-serif', lineHeight: '1.5' }}>
        <h1 style={{ color: '#000' }}>Neuer Auftrag eingegangen! 🎉</h1>
        <p>Hallo Luan,</p>
        <p>Es gibt eine neue Buchung für Tonnenheld:</p>
        <hr style={{ border: '1px solid #eee', margin: '20px 0' }} />

        <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px' }}>
            <p><strong>Kunde:</strong> {customerName}</p>
            <p><strong>Adresse:</strong> {customerAddress}</p>
            <p><strong>Datum:</strong> {serviceDate}</p>
            <p><strong>Tonne:</strong> {binType}</p>
            <p><strong>Leistung:</strong> {serviceScope}</p>
        </div>

        <hr style={{ border: '1px solid #eee', margin: '20px 0' }} />
        <p>
            <a href="https://tonnenheld.vercel.app/admin" style={{ color: '#0070f3', textDecoration: 'none' }}>
                Zum Admin-Dashboard
            </a>
        </p>
    </div>
);
