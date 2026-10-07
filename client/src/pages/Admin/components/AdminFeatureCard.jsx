import React, { memo } from 'react';
import { LuArrowRight, LuLayers } from 'react-icons/lu';
const BADGE_STYLES = {alert:'bg-rose-50 text-rose-700 border-rose-200',warning:'bg-amber-50 text-amber-800 border-amber-200',success:'bg-emerald-50 text-emerald-800 border-emerald-200',info:'bg-neutral-100 text-neutral-800 border-neutral-200',neutral:'bg-neutral-100 text-neutral-600 border-neutral-200'};
export const AdminFeatureCard = memo(({id,title,description,category,categoryLabel,icon:Icon,badge,badgeVariant='neutral',onClick,onMouseEnter}) => {
  const RenderIcon=Icon || LuLayers;
  return <button type="button" className="admin-feature-card" onClick={()=>onClick(id)} onMouseEnter={()=>onMouseEnter?.(id)}>
    <span className="flex items-start justify-between gap-3"><span className="admin-feature-icon"><RenderIcon aria-hidden="true"/></span>{badge && <span className={`text-xs font-semibold px-2 py-1 rounded-lg border min-w-0 break-words ${BADGE_STYLES[badgeVariant] || BADGE_STYLES.neutral}`}>{badge}</span>}</span>
    <span className="grid gap-2"><span className="text-base font-semibold leading-snug">{title}</span><span className="text-sm text-on-surface-variant leading-relaxed">{description}</span></span>
    <span className="flex items-center justify-between gap-3 text-xs text-on-surface-variant"><span>{categoryLabel || category || 'Buka halaman'}</span><LuArrowRight aria-hidden="true" className="shrink-0"/></span>
  </button>;
});
