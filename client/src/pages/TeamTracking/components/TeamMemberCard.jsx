import React from 'react';
import { LuMapPin, LuClock } from 'react-icons/lu';
import { Card } from '../../../components/common/Card';
import { Avatar } from '../../../components/common/Avatar';
import { Badge } from '../../../components/common/Badge';

/**
 * TeamMemberCard Component (Single Responsibility: Individual Team Member Card)
 * 1 File per Component
 */
export const TeamMemberCard = ({ member }) => {
  return (
    <Card className="rounded-2xl p-6 flex items-center gap-5">
      <Avatar src={member.avatar} alt={member.name} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-base font-bold text-on-surface truncate">{member.name}</h3>
          <Badge variant={member.status}>{member.status}</Badge>
        </div>
        <p className="text-xs text-on-surface-variant mb-2">{member.role}</p>
        <div className="flex items-center gap-4 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <LuMapPin className="text-sm" />
            {member.location}
          </span>
          <span className="flex items-center gap-1">
            <LuClock className="text-sm" />
            {member.time}
          </span>
        </div>
      </div>
    </Card>
  );
};
