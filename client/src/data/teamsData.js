// Initial Supervisor Teams
export const INITIAL_SUPERVISOR_TEAMS = [
    {
        id: 'team-spv-1',
        spvName: 'Ahmad Subagja',
        spvTeam: 'Tim SPV Ahmad Subagja (Cimahi & KBB)',
        cluster: 'Region Cimahi - Bandung Barat',
        memberSalesNames: ['Budi Santoso', 'Siti Rahma', 'Agus Wijaya'],
    },
];

// Initial Sales Reps List with Supervisor and Tim RJP links
export const INITIAL_SALES_LIST = [
    { id: 'sales-1', name: 'Budi Santoso', email: 'sales@sinaranugrah.com', phone: '0812-1111-2222', spvName: 'Ahmad Subagja', spvTeamName: 'Tim SPV Ahmad Subagja (Cimahi & KBB)', rjpTeamId: 'rjp-team-1', rjpTeamName: 'Tim RJP Cimahi Tengah', cluster: 'Klaster Cimahi Tengah', status: 'Checked In', location: 'Cimahi Tengah', avatar: null },
    { id: 'sales-2', name: 'Siti Rahma', email: 'siti@sinaranugrah.com', phone: '0812-3333-4444', spvName: 'Ahmad Subagja', spvTeamName: 'Tim SPV Ahmad Subagja (Cimahi & KBB)', rjpTeamId: 'rjp-team-2', rjpTeamName: 'Tim RJP Padalarang', cluster: 'Klaster Padalarang', status: 'In Transit', location: 'Padalarang', avatar: null },
    { id: 'sales-3', name: 'Agus Wijaya', email: 'agus@sinaranugrah.com', phone: '0812-5555-6666', spvName: 'Ahmad Subagja', spvTeamName: 'Tim SPV Ahmad Subagja (Cimahi & KBB)', rjpTeamId: 'rjp-team-3', rjpTeamName: 'Tim RJP Lembang', cluster: 'Klaster Lembang', status: 'Checked In', location: 'Lembang', avatar: null },
];

// Initial Tim RJP / Tim Kunjungan (Created on-demand by Ops Manager / SPV)
export const INITIAL_RJP_TEAMS = [
    {
        id: 'rjp-team-1',
        name: 'Tim RJP Cimahi Tengah (RJP-CIMAHI-01)',
        spvName: 'Ahmad Subagja',
        cluster: 'Klaster Cimahi Tengah',
        memberSalesNames: ['Budi Santoso'],
        assignedDays: ['Senin'],
        routesCount: 10,
        createdAt: '2026-08-01',
        createdBy: 'Bambang Suroso (Ops Manager)',
    },
    {
        id: 'rjp-team-2',
        name: 'Tim RJP Padalarang (RJP-PADALARANG-01)',
        spvName: 'Ahmad Subagja',
        cluster: 'Klaster Padalarang',
        memberSalesNames: ['Siti Rahma'],
        assignedDays: ['Selasa'],
        routesCount: 10,
        createdAt: '2026-08-02',
        createdBy: 'Ahmad Subagja (Supervisor)',
    },
    {
        id: 'rjp-team-3',
        name: 'Tim RJP Lembang (RJP-LEMBANG-01)',
        spvName: 'Ahmad Subagja',
        cluster: 'Klaster Lembang',
        memberSalesNames: ['Agus Wijaya'],
        assignedDays: ['Rabu'],
        routesCount: 10,
        createdAt: '2026-08-05',
        createdBy: 'Ahmad Subagja (Supervisor)',
    },
];

// Initial Field Team Members
export const INITIAL_TEAM_MEMBERS = [
    { id: 'tm-1', name: 'Budi Santoso', role: 'Senior Sales Executive', status: 'Checked In', time: '08:30 WIB', location: 'Cimahi Tengah', avatar: null },
    { id: 'tm-2', name: 'Siti Rahma', role: 'Field Representative', status: 'In Transit', time: '08:45 WIB', location: 'Padalarang', avatar: null },
    { id: 'tm-3', name: 'Agus Wijaya', role: 'Account Manager', status: 'Checked In', time: '08:15 WIB', location: 'Lembang', avatar: null },
];
