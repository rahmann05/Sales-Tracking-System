import React from 'react';

/**
 * LoginHero Component — Apple Editorial
 * Single Responsibility: Render numbered feature list for hero section.
 * Used inside LoginPage's hero section.
 */
export const LoginHero = () => {
    const features = [
        { num: '01', title: 'Real-time Tracking', desc: 'GPS & geofencing untuk tim lapangan' },
        { num: '02', title: 'Route Optimization', desc: 'TSP algorithm untuk efisiensi kunjungan' },
        { num: '03', title: 'Absensi Digital', desc: 'Foto + lokasi untuk validasi kehadiran' },
        { num: '04', title: 'Role-Based Access', desc: 'Kontrol akses untuk setiap peran' },
    ];

    return (
        <>
            {features.map((f) => (
                <div key={f.num} className="login-hero-feature">
                    <div className="login-hero-feature-num">{f.num}</div>
                    <div className="login-hero-feature-text">
                        <span className="login-hero-feature-title">{f.title}</span>
                        <span className="login-hero-feature-desc">{f.desc}</span>
                    </div>
                </div>
            ))}
        </>
    );
};
