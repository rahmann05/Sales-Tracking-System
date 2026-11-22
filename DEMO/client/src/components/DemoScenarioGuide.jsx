import React from 'react';

export function DemoScenarioGuide({ scenarios, accounts, busyAction, onSwitchUser }) {
  const firstByRole = (role) => accounts.find((acc) => acc.role === role);

  return (
    <div className="demo-stack">
      <p className="demo-hint">
        Klik tombol peran pada setiap langkah skenario untuk berpindah akun sesuai alur pengujian.
      </p>
      {(scenarios || []).map((scenario) => (
        <div key={scenario.id} className="demo-scenario-card">
          <div className="demo-scenario-title">{scenario.title}</div>
          <p className="demo-scenario-summary">{scenario.summary}</p>
          <ol className="demo-scenario-steps">
            {scenario.steps.map((step, index) => {
              const target = firstByRole(step.role);
              return (
                <li key={`${scenario.id}-${index}`} className="demo-scenario-step">
                  <span className="demo-step-text">{step.action}</span>
                  {target && (
                    <button
                      type="button"
                      className="demo-btn-mini"
                      disabled={Boolean(busyAction)}
                      onClick={() => onSwitchUser(target.id)}
                    >
                      Buka {step.role}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
