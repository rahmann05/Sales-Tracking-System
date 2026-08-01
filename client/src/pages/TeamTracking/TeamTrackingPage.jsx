import React from 'react';
import { TeamTrackingHeader } from './components/TeamTrackingHeader';
import { TeamMemberCard } from './components/TeamMemberCard';
import '../../styles/pages/TeamTracking.css';

const teamMembers = [
  { name: 'Budi Santoso', role: 'Senior Sales Executive', status: 'Checked In', time: '08:30 AM', location: 'Jakarta Pusat', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { name: 'Siti Rahma', role: 'Field Representative', status: 'In Transit', time: '08:45 AM', location: 'Jakarta Barat', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { name: 'Agus Wijaya', role: 'Account Manager', status: 'Checked In', time: '08:15 AM', location: 'Jakarta Selatan', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
  { name: 'Dewi Lestari', role: 'Sales Representative', status: 'Completed', time: '12:00 PM', location: 'Tangerang', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
];

export const TeamTrackingPage = () => {
  return (
    <div className="page-container">
      <TeamTrackingHeader />

      <div className="team-grid">
        {teamMembers.map((member, idx) => (
          <TeamMemberCard key={idx} member={member} />
        ))}
      </div>
    </div>
  );
};
