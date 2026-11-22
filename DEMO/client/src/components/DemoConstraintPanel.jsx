import React from 'react';

export function DemoConstraintPanel({
  groups,
  policy,
  guardrails,
  busyAction,
  onToggleGroup,
  onEnableAll,
  onRestoreNormal,
}) {
  const activeGroups = policy?.activeGroups || {};
  const groupList = Object.values(groups || {});

  return (
    <div className="demo-stack">
      <div className="demo-toolbar-row">
        <button
          type="button"
          className="demo-btn-primary"
          disabled={Boolean(busyAction)}
          onClick={onEnableAll}
        >
          Longgarkan Semua Constraint
        </button>
        <button
          type="button"
          className="demo-btn-secondary"
          disabled={Boolean(busyAction) || !policy?.hasBackup}
          onClick={onRestoreNormal}
        >
          Pulihkan Policy Normal
        </button>
      </div>

      <div className="demo-section-label">Preset Pelonggaran Demo (Reversibel)</div>
      <div className="demo-group-list">
        {groupList.map((group) => {
          const checked = Boolean(activeGroups[group.id]);
          return (
            <label key={group.id} className="demo-group-item">
              <input
                type="checkbox"
                checked={checked}
                disabled={Boolean(busyAction)}
                onChange={() => onToggleGroup(group.id)}
              />
              <div>
                <div className="demo-group-title">{group.label}</div>
                <div className="demo-group-desc">{group.description}</div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="demo-section-label">Guardrail Wajib (Tetap Terkunci)</div>
      <ul className="demo-guardrail-list">
        {(guardrails || []).map((item) => (
          <li key={item.id} className="demo-guardrail-item">
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
