import React from 'react';
import Link from 'next/link';

/**
 * @fileOverview Custom 404 Error page for the Kalamic collection.
 * Styled using the Mitti & Cream design system.
 */
export default function NotFound() {
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center', 
      backgroundColor: '#fef9f0', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      color: '#292524',
      fontFamily: '"Lato", sans-serif'
    }}>
      <h1 style={{ 
        fontFamily: '"Playfair Display", serif', 
        fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
        fontWeight: 700,
        color: '#92400e',
        marginBottom: '16px'
      }}>
        404 — Page Not Found
      </h1>
      <p style={{ 
        fontSize: '1rem', 
        color: '#78716c', 
        marginBottom: '32px',
        maxWidth: '420px',
        lineHeight: 1.65
      }}>
        The artisanal piece you are looking for has returned to the clay. 
        It may have been moved or archived from our current collection.
      </p>
      <Link href="/" style={{ 
        backgroundColor: '#d97706', 
        color: '#fef9f0', 
        padding: '14px 28px', 
        borderRadius: '4px', 
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '14px',
        letterSpacing: '0.05em'
      }}>
        Return to Home
      </Link>
    </div>
  );
}
