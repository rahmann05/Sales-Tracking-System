import React from 'react';
import { LuStore } from 'react-icons/lu';

/**
 * ChannelSubChannelSection Component
 * Single Responsibility: Manage Channel (GT vs MT), Sub Channel, and Channel Tier.
 */
export const ChannelSubChannelSection = ({
  channel,
  subChannel,
  channelTier,
  onChange,
}) => {
  return (
    <div className="outlet-reg-section-card">
      <div className="outlet-reg-section-title">
        <LuStore className="text-primary" />
        <span>6. Klasifikasi Channel & Sub Channel</span>
      </div>
      <div className="space-y-4">
        {/* Choice GT vs MT */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => {
              onChange('channel', 'GENERAL_TRADE');
              onChange('subChannel', 'TOKO_RETAIL');
            }}
            className={`outlet-reg-radio-card justify-center ${
              channel === 'GENERAL_TRADE' ? 'active' : ''
            }`}
          >
            <input
              type="radio"
              checked={channel === 'GENERAL_TRADE'}
              onChange={() => {}}
            />
            <span className="font-extrabold text-xs">GENERAL TRADE (GT)</span>
          </div>
          <div
            onClick={() => {
              onChange('channel', 'MODERN_TRADE');
              onChange('subChannel', 'CHAIN_MINIMARKET');
            }}
            className={`outlet-reg-radio-card justify-center ${
              channel === 'MODERN_TRADE' ? 'active' : ''
            }`}
          >
            <input
              type="radio"
              checked={channel === 'MODERN_TRADE'}
              onChange={() => {}}
            />
            <span className="font-extrabold text-xs">MODERN TRADE (MT)</span>
          </div>
        </div>

        {/* Sub Channel Dropdown */}
        <div>
          <label className="outlet-reg-label">SUB CHANNEL</label>
          <select
            value={subChannel}
            onChange={(e) => onChange('subChannel', e.target.value)}
            className="outlet-reg-input text-xs font-bold"
          >
            {channel === 'GENERAL_TRADE' ? (
              <>
                <option value="TOKO_RETAIL">TOKO / RETAIL</option>
                <option value="GROSIR">GROSIR</option>
                <option value="BABY_SHOP">BABY SHOP / TOKO SUSU</option>
                <option value="APOTIK">APOTIK</option>
                <option value="KOPERASI">KOPERASI</option>
                <option value="BIDAN">BIDAN</option>
                <option value="OUTLET_MOTORIS">OUTLET MOTORIS</option>
              </>
            ) : (
              <>
                <option value="CHAIN_MINIMARKET">CHAIN MINIMARKET</option>
                <option value="LOKAL_MINIMARKET">LOKAL MINIMARKET</option>
                <option value="LOKAL_SUPERMARKET">LOKAL SUPERMARKET</option>
                <option value="NAT_SUPERMARKET">NAT SUPERMARKET</option>
                <option value="HYPERMARKET">HYPERMARKET</option>
                <option value="DRUGSTORE">DRUGSTORE</option>
                <option value="PERKULAKAN">PERKULAKAN</option>
              </>
            )}
          </select>
        </div>

        {/* Channel Tier */}
        <div>
          <label className="outlet-reg-label">TIER CHANNEL</label>
          <div className="grid grid-cols-3 gap-2">
            {['BRONZE_A', 'BRONZE_B', 'BRONZE_C'].map((tier) => (
              <div
                key={tier}
                onClick={() => onChange('channelTier', tier)}
                className={`outlet-reg-radio-card justify-center p-2 text-xs font-bold ${
                  channelTier === tier ? 'active' : ''
                }`}
              >
                {tier.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
