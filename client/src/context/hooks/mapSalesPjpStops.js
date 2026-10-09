export const formatTimeWib = (ts) => {
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB';
};

export const resolveStopStatus = (s, inAtt, outAtt) => {
  if (outAtt || s.status === 'VISITED' || s.status === 'COMPLETED') return 'VISITED';
  if (s.status === 'SKIPPED') return 'SKIPPED';
  if (s.status === 'CLOSED_REPORTED' || s.status === 'CLOSED') return 'CLOSED';
  if (inAtt || s.status === 'ARRIVED' || s.status === 'IN_VISIT') return 'ARRIVED';
  return 'PENDING';
};


export const mapSalesPjpStops = (pjpData, user) => {
const cluster = pjpData.user?.cluster;
          const mappedStops = pjpData.stops.map((s, idx) => {
            const stopCluster = s.outlet?.cluster || cluster;
            const spv = stopCluster?.users?.find((u) => u.role === 'SUPERVISOR');
            const area = stopCluster?.region || stopCluster?.name || (s.outlet?.address ? s.outlet.address.split(',').pop().trim() : '-');

            const inAtt = s.attendances?.find((a) => a.type === 'IN');
            const outAtt = s.attendances?.find((a) => a.type === 'OUT');
            const stopStatus = resolveStopStatus(s, inAtt, outAtt);
            const intervalWeeks=pjpData.reportingContext?.planning?.rules?.find(rule=>rule.outletId===(s.outletId||s.outlet?.id))?.intervalWeeks;

            return {
              id: s.id,
              pjpId: pjpData.id,
              sequence: s.sequence || idx + 1,
              customerName: s.outlet?.name || '',
              outletName: s.outlet?.name || '',
              owner: s.outlet?.ownerName || s.outlet?.owner || '',
              phone: s.outlet?.phone || '',
              address: s.outlet?.address || '',
              type: s.outlet?.type || 'MODERN_TRADE',
              latitude: s.outlet?.latitude != null ? Number(s.outlet.latitude) : (s.latitude != null ? Number(s.latitude) : null),
              longitude: s.outlet?.longitude != null ? Number(s.outlet.longitude) : (s.longitude != null ? Number(s.longitude) : null),
              outletId: s.outletId || s.outlet?.id,
              outlet: s.outlet,
              radiusMeters: s.outlet?.radiusMeters ?? null,
              outstanding: s.outlet?.outstanding || 0,
              callplanName: pjpData.name || '',
              callFrequency: intervalWeeks?`F${intervalWeeks}`:s.callFrequency || s.outlet?.itineraryCode || null,
              clusterName: stopCluster?.name || pjpData.clusterName || '',
              regionName: stopCluster?.region || pjpData.regionName || area,
              subDistrict: area,
              supervisorName: stopCluster?.supervisor?.name || spv?.name || '',
              dayOfWeek: pjpData.dayOfWeek || '',
              assignedSalesName: user?.name || '',
              customerId: s.outlet?.outletCode || '',
              outletCode: s.outlet?.outletCode || '',
              lockStatus: s.outlet?.lockStatus || 'NORMAL',
              status: stopStatus,
              inTimestamp: inAtt?.timestamp ? new Date(inAtt.timestamp).toISOString() : null,
              outTimestamp: outAtt?.timestamp ? new Date(outAtt.timestamp).toISOString() : null,
              checkInTime: formatTimeWib(inAtt?.timestamp),
              checkOutTime: formatTimeWib(outAtt?.timestamp),
              checkInPhoto: inAtt?.photoUrl || null,
              checkOutPhoto: outAtt?.photoUrl || null,
              checkInNotes: inAtt?.notes || null,
              checkOutNotes: outAtt?.notes || null,
              visitOutcome:outAtt?.visitOutcome||null,
              durationMinutes: outAtt?.durationMinutes || null,
              deviationMeters: inAtt?.deviationMeters ?? null,
            };
          });

return mappedStops;
};
