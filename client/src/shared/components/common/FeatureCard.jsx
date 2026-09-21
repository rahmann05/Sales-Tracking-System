import React from 'react';

export const FeatureCard = ({ title, icon, items, titleColorClass }) => {
  return (
    <div className="card">
      <h3 className="feature-card-title" style={{ color: `var(${titleColorClass})` }}>
        {icon} {title}
      </h3>
      <ul className="feature-card-list">
        {items.map((item, idx) => (
          <li key={idx}>
            <strong>{item.label}</strong>: {item.description}
          </li>
        ))}
      </ul>
    </div>
  );
};
