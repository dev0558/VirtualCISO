import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Info,
  CheckCircle2,
  ArrowRight,
  Filter,
  RefreshCw,
  Layers
} from 'lucide-react';
import { RiskEntry } from '../types/compliance';

interface RiskHeatmapProps {
  risks: RiskEntry[];
  selectedRiskId: string | null;
  onSelectRisk: (riskId: string | null) => void;
  selectedCategoryFilter: string | null;
  onFilterCategory: (cat: string | null) => void;
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({
  risks,
  selectedRiskId,
  onSelectRisk,
  selectedCategoryFilter,
  onFilterCategory
}) => {
  const [selectedCell, setSelectedCell] = useState<{ likelihood: number; impact: number } | null>(null);
  const [filterUntreatedOnly, setFilterUntreatedOnly] = useState(true);

  // Active risks considered in the heatmap
  const activeRisks = filterUntreatedOnly
    ? risks.filter((r) => r.status !== 'Treated')
    : risks;

  // Likelihood levels (5 down to 1)
  const likelihoodLevels = [
    { value: 5, label: '5 - Almost Certain', short: 'Almost Certain' },
    { value: 4, label: '4 - Likely', short: 'Likely' },
    { value: 3, label: '3 - Possible', short: 'Possible' },
    { value: 2, label: '2 - Unlikely', short: 'Unlikely' },
    { value: 1, label: '1 - Rare', short: 'Rare' }
  ];

  // Impact levels (1 to 5)
  const impactLevels = [
    { value: 1, label: '1 - Negligible', short: 'Negligible' },
    { value: 2, label: '2 - Minor', short: 'Minor' },
    { value: 3, label: '3 - Moderate', short: 'Moderate' },
    { value: 4, label: '4 - Major', short: 'Major' },
    { value: 5, label: '5 - Catastrophic', short: 'Catastrophic' }
  ];

  // Helper to determine risk band and colors
  const getRiskBand = (score: number) => {
    if (score >= 15) {
      return {
        level: 'Critical',
        bg: 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-300',
        activeBg: 'bg-rose-600 text-white ring-2 ring-rose-400',
        text: 'text-rose-900',
        badge: 'bg-rose-600 text-white',
        border: 'border-rose-400'
      };
    }
    if (score >= 10) {
      return {
        level: 'High',
        bg: 'bg-orange-500/15 hover:bg-orange-500/25 border-orange-300',
        activeBg: 'bg-orange-600 text-white ring-2 ring-orange-400',
        text: 'text-orange-950',
        badge: 'bg-orange-600 text-white',
        border: 'border-orange-400'
      };
    }
    if (score >= 5) {
      return {
        level: 'Medium',
        bg: 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-300',
        activeBg: 'bg-amber-600 text-white ring-2 ring-amber-400',
        text: 'text-amber-950',
        badge: 'bg-amber-600 text-white',
        border: 'border-amber-400'
      };
    }
    return {
      level: 'Low',
      bg: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-300',
      activeBg: 'bg-emerald-600 text-white ring-2 ring-emerald-400',
      text: 'text-emerald-950',
      badge: 'bg-emerald-600 text-white',
      border: 'border-emerald-400'
    };
  };

  // Get risks for a specific (likelihood, impact) coordinate
  const getRisksInCell = (l: number, i: number) => {
    return activeRisks.filter((r) => r.likelihood === l && r.impact === i);
  };

  // Total counts by band
  const criticalCount = activeRisks.filter((r) => r.riskScore >= 15).length;
  const highCount = activeRisks.filter((r) => r.riskScore >= 10 && r.riskScore < 15).length;
  const mediumCount = activeRisks.filter((r) => r.riskScore >= 5 && r.riskScore < 10).length;
  const lowCount = activeRisks.filter((r) => r.riskScore < 5).length;

  const totalEvaluated = activeRisks.length;
  const averageScore = totalEvaluated > 0
    ? (activeRisks.reduce((acc, r) => acc + r.riskScore, 0) / totalEvaluated).toFixed(1)
    : '0';

  const handleCellClick = (l: number, i: number) => {
    if (selectedCell?.likelihood === l && selectedCell?.impact === i) {
      setSelectedCell(null);
    } else {
      setSelectedCell({ likelihood: l, impact: i });
      const inCell = getRisksInCell(l, i);
      if (inCell.length > 0) {
        onSelectRisk(inCell[0].id);
      }
    }
  };

  const selectedCellRisks = selectedCell
    ? getRisksInCell(selectedCell.likelihood, selectedCell.impact)
    : [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Risk Quantification Matrix</span>
            <span aria-hidden="true">·</span>
            <span>5×5 Likelihood × Impact Standard</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-800 tabular-nums">Avg Risk Score: {averageScore} / 25</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600" />
            <span>Interactive 5×5 Risk Heatmap</span>
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Click any matrix coordinate or risk band to inspect localized risks, assigned owners, and treatment controls.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={filterUntreatedOnly}
              onChange={(e) => setFilterUntreatedOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Untreated Risks Only ({activeRisks.length})</span>
          </label>

          {selectedCell && (
            <button
              onClick={() => {
                setSelectedCell(null);
                onSelectRisk(null);
              }}
              className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Clear Matrix Filter
            </button>
          )}
        </div>
      </div>

      {/* Risk Band Distribution Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setSelectedCell(null);
            onFilterCategory(selectedCategoryFilter === 'Critical' ? null : 'Critical');
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategoryFilter === 'Critical'
              ? 'ring-2 ring-rose-500 border-rose-400 bg-rose-50'
              : 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-900 uppercase">Critical (15-25)</span>
            <span className="w-2 h-2 rounded-full bg-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 tabular-nums mt-1">{criticalCount}</div>
          <span className="text-[10px] text-rose-800">Immediate Sprint 1 mitigation</span>
        </button>

        <button
          onClick={() => {
            setSelectedCell(null);
            onFilterCategory(selectedCategoryFilter === 'High' ? null : 'High');
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategoryFilter === 'High'
              ? 'ring-2 ring-orange-500 border-orange-400 bg-orange-50'
              : 'border-orange-200 bg-orange-50/40 hover:bg-orange-50/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-950 uppercase">High (10-14)</span>
            <span className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-700 tabular-nums mt-1">{highCount}</div>
          <span className="text-[10px] text-orange-900">Sprint 1 or 2 treatment target</span>
        </button>

        <button
          onClick={() => {
            setSelectedCell(null);
            onFilterCategory(selectedCategoryFilter === 'Medium' ? null : 'Medium');
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategoryFilter === 'Medium'
              ? 'ring-2 ring-amber-500 border-amber-400 bg-amber-50'
              : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-950 uppercase">Medium (5-9)</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 tabular-nums mt-1">{mediumCount}</div>
          <span className="text-[10px] text-amber-900">Sprint 3 or operational watch</span>
        </button>

        <button
          onClick={() => {
            setSelectedCell(null);
            onFilterCategory(selectedCategoryFilter === 'Low' ? null : 'Low');
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedCategoryFilter === 'Low'
              ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50'
              : 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-950 uppercase">Low (1-4)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">{lowCount}</div>
          <span className="text-[10px] text-emerald-900">Standard business review</span>
        </button>
      </div>

      {/* 5x5 Matrix Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Heatmap Grid (8 Columns) */}
        <div className="lg:col-span-8 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Matrix Coordinates (Likelihood Y vs Impact X)
            </span>
            <span className="text-[11px] text-slate-500">
              Numbers indicate cell risk score (L × I)
            </span>
          </div>

          <div className="flex gap-3">
            {/* Y-Axis Label */}
            <div className="flex flex-col justify-between py-6 items-center w-8 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 -rotate-90 whitespace-nowrap tracking-wider">
                LIKELIHOOD ↑
              </span>
            </div>

            {/* Matrix Body */}
            <div className="flex-1 space-y-2">
              {likelihoodLevels.map((l) => (
                <div key={l.value} className="grid grid-cols-5 gap-2 items-center">
                  {impactLevels.map((imp) => {
                    const score = l.value * imp.value;
                    const band = getRiskBand(score);
                    const cellRisks = getRisksInCell(l.value, imp.value);
                    const hasRisks = cellRisks.length > 0;
                    const isSelected = selectedCell?.likelihood === l.value && selectedCell?.impact === imp.value;

                    return (
                      <button
                        key={`${l.value}-${imp.value}`}
                        onClick={() => handleCellClick(l.value, imp.value)}
                        className={`h-14 rounded-lg border flex flex-col justify-between p-1.5 transition-all text-left relative cursor-pointer ${
                          isSelected
                            ? band.activeBg
                            : `${band.bg} ${band.border}`
                        } ${hasRisks && !isSelected ? 'ring-2 ring-slate-800/20 shadow-xs' : ''}`}
                        title={`Likelihood ${l.value} × Impact ${imp.value} = Score ${score}. ${cellRisks.length} risks.`}
                      >
                        {/* Top strip: Score & Risk Count badge */}
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-mono text-[10px] font-bold tabular-nums ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                            {score}
                          </span>

                          {hasRisks && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums shadow-2xs ${
                                isSelected ? 'bg-white text-slate-900' : band.badge
                              }`}
                            >
                              {cellRisks.length} {cellRisks.length === 1 ? 'risk' : 'risks'}
                            </span>
                          )}
                        </div>

                        {/* Cell footer: tiny risk dots */}
                        {hasRisks && (
                          <div className="flex items-center gap-1 overflow-hidden">
                            {cellRisks.map((cr, idx) => (
                              <span
                                key={cr.id}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? 'bg-white' : 'bg-slate-900'
                                }`}
                                title={cr.title}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* X-Axis Labels (Impact 1-5) */}
              <div className="grid grid-cols-5 gap-2 pt-2 text-center">
                {impactLevels.map((imp) => (
                  <div key={imp.value} className="text-center">
                    <span className="block font-mono text-[11px] font-bold text-slate-800 tabular-nums">
                      {imp.value}
                    </span>
                    <span className="block text-[10px] text-slate-500 truncate" title={imp.label}>
                      {imp.short}
                    </span>
                  </div>
                ))}
              </div>

              {/* X-Axis Title */}
              <div className="text-center pt-1">
                <span className="text-[11px] font-bold text-slate-500 tracking-wider">
                  IMPACT (1-5) →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Coordinate Details Panel (4 Columns) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Active Coordinate Focus
              </span>
              {selectedCell && (
                <span className="text-[11px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                  Score: {selectedCell.likelihood * selectedCell.impact}
                </span>
              )}
            </div>

            {selectedCell ? (
              <p className="text-xs text-slate-500">
                Likelihood: <strong className="text-slate-800">{selectedCell.likelihood}</strong> · Impact: <strong className="text-slate-800">{selectedCell.impact}</strong> ({selectedCellRisks.length} risks mapped)
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Click any cell in the 5×5 matrix to isolate mapped risks, inspect mitigation progress, and assign roadmap tasks.
              </p>
            )}
          </div>

          {selectedCell ? (
            <div className="space-y-3">
              {selectedCellRisks.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No active risks currently mapped to this exact coordinate (L:{selectedCell.likelihood}, I:{selectedCell.impact}).
                </div>
              ) : (
                selectedCellRisks.map((risk) => {
                  const isRiskSelected = selectedRiskId === risk.id;
                  return (
                    <div
                      key={risk.id}
                      onClick={() => onSelectRisk(isRiskSelected ? null : risk.id)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                        isRiskSelected
                          ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-200'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          {risk.category}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            risk.status === 'Treated'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {risk.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-1">
                        {risk.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                        {risk.description}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] text-slate-700 space-y-1">
                        <div>
                          <strong className="text-slate-900">Treatment ({risk.treatment}):</strong> {risk.treatmentPlan}
                        </div>
                        <div className="flex justify-between text-slate-500 text-[10px]">
                          <span>Owner: {risk.owner.split(' ')[0]}</span>
                          <span>Score: {risk.riskScore}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-slate-700 block">Top Priority Remediation Targets:</span>
              {activeRisks
                .sort((a, b) => b.riskScore - a.riskScore)
                .slice(0, 3)
                .map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedCell({ likelihood: r.likelihood, impact: r.impact });
                      onSelectRisk(r.id);
                    }}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50/30 hover:border-indigo-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-rose-700">Score {r.riskScore}</span>
                      <span className="text-slate-500 font-mono">L:{r.likelihood} × I:{r.impact}</span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 mt-0.5">{r.title}</h5>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{r.treatmentPlan}</p>
                  </div>
                ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
