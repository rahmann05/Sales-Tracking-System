import React from 'react';
import { LuFuel, LuTrendingUp, LuDollarSign } from 'react-icons/lu';
import { VehicleCapacityBadge } from './VehicleCapacityBadge';
import '../../../../styles/components/DeliveryCostEstimator.css';

/**
 * DeliveryCostEstimator Component
 * Single Responsibility: Display Fuel Cost, Payload Capacity & Profit Margin Estimator for Logistical Routing.
 * 1 File = 1 Component
 */
export const DeliveryCostEstimator = ({
  vehicleType,
  onVehicleChange,
  distanceKm,
  onDistanceChange,
  fillRate,
  fuelCost,
  profitability,
  vehicleSpecs = {},
}) => {
  return (
    <div className="delivery-cost-card">
      <div className="delivery-cost-header">
        <div>
          <h3 className="text-base font-extrabold text-on-surface flex items-center gap-2">
            <LuFuel className="text-primary" />
            <span>Kalkulator Muatan Armada & Estimasi Biaya Bensin</span>
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Optimasi kapasitas mobil, konsumsi BBM, dan efisiensi margin pengiriman
          </p>
        </div>

        {/* Vehicle Selector */}
        <select
          value={vehicleType}
          onChange={(e) => onVehicleChange(e.target.value)}
          className="px-3 py-1.5 bg-surface-container-high border border-border-glass rounded-xl text-xs font-bold text-on-surface outline-none cursor-pointer"
        >
          {Object.keys(vehicleSpecs).map((key) => (
            <option key={key} value={key}>
              {vehicleSpecs[key].name} (Maks {vehicleSpecs[key].maxCartons} Karton)
            </option>
          ))}
        </select>
      </div>

      {/* Vehicle Payload Capacity Bar */}
      <VehicleCapacityBadge fillRate={fillRate} />

      {/* 3 Metric Mini Stats */}
      <div className="delivery-cost-grid">
        {/* 1. Distance & Fuel Liter */}
        <div className="delivery-cost-mini-stat">
          <span className="delivery-cost-mini-label">Estimasi Jarak & BBM</span>
          <div className="delivery-cost-mini-val">
            {distanceKm} KM <span className="text-xs font-semibold text-primary">({fuelCost.litersNeeded} L)</span>
          </div>
          <span className="text-[10px] text-on-surface-variant">Tipe: {fuelCost.fuelType}</span>
        </div>

        {/* 2. Estimated Fuel Cost */}
        <div className="delivery-cost-mini-stat">
          <span className="delivery-cost-mini-label">Total Biaya Bensin</span>
          <div className="delivery-cost-mini-val text-amber-600">
            Rp {fuelCost.totalCost.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-on-surface-variant">@ Rp {fuelCost.fuelPricePerLiter.toLocaleString('id-ID')}/L</span>
        </div>

        {/* 3. Gross Margin / Net Delivery Profit */}
        <div className="delivery-cost-mini-stat">
          <span className="delivery-cost-mini-label">Gross Margin Delivery (6%)</span>
          <div className="delivery-cost-mini-val text-emerald-600">
            Rp {profitability.grossProfit.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
            <LuTrendingUp /> Net Margin: Rp {profitability.netMargin.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
};
