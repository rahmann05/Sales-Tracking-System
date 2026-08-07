import React from 'react';
import { LuShieldCheck } from 'react-icons/lu';
import { Avatar } from '../../../components/common/Avatar';
import { useApp } from '../../../context/AppContext';

export const SpvTeamListTab = ({ filteredSupervisorTeams }) => {
  const { salesList = [] } = useApp();

  return (
    <div className="flex flex-col gap-4">
      {filteredSupervisorTeams.map((team) => {
        const teamSales = salesList.filter(s => team.memberSalesNames?.includes(s.name));

        return (
          <div key={team.id} className="app-card space-y-4">
            <div className="flex-between border-b border-border-glass pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center font-bold">
                  <LuShieldCheck className="text-xl" />
                </div>
                <div>
                  <h4 className="card-title">{team.spvTeam}</h4>
                  <p className="card-subtitle">Supervisor: <strong>{team.spvName}</strong></p>
                </div>
              </div>
              <span className="badge-tertiary">{team.cluster}</span>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold text-on-surface mb-2">Anggota Sales Terdaftar ({teamSales.length || team.memberSalesNames?.length || 0}):</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-variant/30 text-on-surface-variant font-semibold">
                      <th className="p-2 border-b border-border-glass rounded-tl-lg whitespace-nowrap">Nama Sales</th>
                      <th className="p-2 border-b border-border-glass whitespace-nowrap">Telepon</th>
                      <th className="p-2 border-b border-border-glass whitespace-nowrap">Tim RJP</th>
                      <th className="p-2 border-b border-border-glass rounded-tr-lg whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamSales.length > 0 ? (
                      teamSales.map((sales, idx) => (
                        <tr key={idx} className="hover:bg-surface-variant/10 transition-colors border-b border-border-glass/50 last:border-0">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Avatar name={sales.name} size="sm" />
                              <span className="font-bold text-on-surface whitespace-nowrap">{sales.name}</span>
                            </div>
                          </td>
                          <td className="p-2 text-on-surface-variant">{sales.phone}</td>
                          <td className="p-2 text-on-surface-variant">{sales.rjpTeamName || '-'}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-md font-bold text-[10px] whitespace-nowrap ${
                              sales.status === 'Checked In' ? 'bg-emerald-500/10 text-emerald-600' :
                              sales.status === 'In Transit' ? 'bg-amber-500/10 text-amber-600' :
                              'bg-primary/10 text-primary'
                            }`}>
                              {sales.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-4 text-center text-on-surface-variant italic">
                          Data detail sales tidak ditemukan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
