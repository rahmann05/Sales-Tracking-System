import React from 'react';
export function RegistrationChannelSection({GT_SUB_CHANNELS,MT_SUB_CHANNELS,TIERS,formData,updateField}) {
  const choices=formData.channel==='MODERN_TRADE'?MT_SUB_CHANNELS:GT_SUB_CHANNELS;
  return <div className="sales-registration-fields">
    <label className="sales-registration-field">Channel pelanggan<select value={formData.channel} onChange={e=>{updateField('channel',e.target.value);updateField('subChannel',e.target.value==='MODERN_TRADE'?'CHAIN_MINIMARKET':'TOKO_RETAIL');}}><option value="GENERAL_TRADE">General Trade (GT)</option><option value="MODERN_TRADE">Modern Trade (MT)</option></select></label>
    <label className="sales-registration-field">Jenis usaha<select value={formData.subChannel} onChange={e=>updateField('subChannel',e.target.value)}>{choices.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <label className="sales-registration-field">Tier pelanggan<select value={formData.channelTier} onChange={e=>updateField('channelTier',e.target.value)}>{TIERS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
  </div>;
}
