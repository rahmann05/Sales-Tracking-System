import React from 'react';
import { LuArrowUpRight } from 'react-icons/lu';
import '../../../styles/pages/AdminNavigation.css';
export function WorkspaceMenuHome({
  role,
  title,
  description,
  groups,
  onNavigate,
  className = '',
}) {
  return (
    <div className={`page-container admin-home ${className}`}>
      <header className="admin-home-heading">
        <div>
          <p className="admin-eyebrow">Sinar Anugrah / {role}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <div className="admin-home-section">
        <h2>Ruang kerja {role}</h2>
        <span>{groups.length} modul tersedia</span>
      </div>
      <div className="admin-home-modules">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <section className="admin-module-card" key={group.id}>
              <button
                type="button"
                className="admin-module-entry"
                onClick={() => onNavigate(group.items[0].id)}
              >
                <span className="admin-module-icon">
                  <Icon aria-hidden="true" />
                </span>
                <LuArrowUpRight className="admin-module-arrow" aria-hidden="true" />
                <h2>{group.label}</h2>
                <p>{group.description}</p>
              </button>
              {group.items.length > 1 && (
                <div className="admin-module-features">
                  {group.items.map((item) => (
                    <button type="button" key={item.id} onClick={() => onNavigate(item.id)}>
                      {item.label}
                      <span aria-hidden="true">›</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
      {!groups.length && (
        <div className="admin-empty">
          <h2>Belum ada menu tersedia</h2>
          <p>
            Belum ada menu yang diizinkan untuk akun ini. Hubungi Admin untuk memeriksa akses.
          </p>
        </div>
      )}
    </div>
  );
}
