import React from 'react';
import { useApp } from '../../context/AppContext';
import { getAdminNavigationGroups } from '../../constants/adminNavigation';
import { LuArrowUpRight } from 'react-icons/lu';
import '../../styles/pages/AdminNavigation.css';
export function AdminLandingPage() {
  const { user, setActiveTab } = useApp();
  const groups = getAdminNavigationGroups(user);
  return (
    <div className="page-container admin-home">
      <header className="admin-home-heading">
        <div>
          <p className="admin-eyebrow">Sinar Anugrah / Admin</p>
          <h1>Ruang kerja Anda.</h1>
          <p>Pilih pekerjaan yang ingin Anda selesaikan.</p>
        </div>
      </header>
      <div className="admin-home-section">
        <h2>Menu admin</h2>
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
                onClick={() => setActiveTab(group.items[0].id)}
              >
                <span className={`admin-module-icon admin-icon-${group.id}`}>
                  <Icon aria-hidden="true" />
                </span>
                <LuArrowUpRight className="admin-module-arrow" aria-hidden="true" />
                <h2>{group.label}</h2>
                <p>{group.description}</p>
              </button>
              <div className="admin-module-features">
                {group.items.map((item) => (
                  <button type="button" key={item.id} onClick={() => setActiveTab(item.id)}>
                    {item.label}
                    <span aria-hidden="true">›</span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {!groups.length && (
        <div className="admin-empty">
          <h2>Belum ada menu tersedia</h2>
          <p>Belum ada menu yang diizinkan untuk akun ini.</p>
        </div>
      )}
    </div>
  );
}
