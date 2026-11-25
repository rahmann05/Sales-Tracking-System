import React from 'react';
import { NooTick } from './NooTick';

/** Satu kotak sub channel (MT atau GT): label di kiri dan kotak V di kanan, seperti formulir. */
function channelColumn({ title, channel, choices, formData, onPick }) {
  const active = (formData.channel || 'GENERAL_TRADE') === channel;
  return (
    <div className="npf-box" data-active={active}>
      <NooTick
        name="channel"
        spread
        strong
        label={title}
        checked={active}
        onChange={() => onPick(channel, choices[0].id)}
      />
      <div className="npf-list">
        {choices.map((item) => (
          <NooTick
            key={item.id}
            name="subChannel"
            spread
            label={item.label}
            checked={active && formData.subChannel === item.id}
            onChange={() => onPick(channel, item.id)}
          />
        ))}
      </div>
    </div>
  );
}

/** Blok CHANEL / SUB CHANEL formulir kertas, dengan pilihan tier (BRONZE A/B/C) di sisi kanan. */
export function RegistrationChannelSection({
  GT_SUB_CHANNELS,
  MT_SUB_CHANNELS,
  TIERS,
  formData,
  updateField,
}) {
  const pick = (channel, subChannel) => {
    if (formData.channel !== channel) updateField('channel', channel);
    updateField('subChannel', subChannel);
  };
  return (
    <section id="registration-channel" className="npf-block">
      <div className="npf-row npf-cols-channel">
        <div className="npf-gutter">
          CHANEL :
          <br />
          SUB CHANEL :
        </div>
        {channelColumn({
          title: 'MODERN TRADE (MT)',
          channel: 'MODERN_TRADE',
          choices: MT_SUB_CHANNELS,
          formData,
          onPick: pick,
        })}
        {channelColumn({
          title: 'GENERAL TRADE (GT)',
          channel: 'GENERAL_TRADE',
          choices: GT_SUB_CHANNELS,
          formData,
          onPick: pick,
        })}
        <fieldset className="npf-list">
          <legend className="npf-heading">CHANEL</legend>
          {TIERS.map((item) => (
            <NooTick
              key={item.id}
              name="channelTier"
              spread
              label={item.label}
              checked={(formData.channelTier || 'BRONZE_C') === item.id}
              onChange={() => updateField('channelTier', item.id)}
            />
          ))}
        </fieldset>
      </div>
    </section>
  );
}
