import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Award, Calendar, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Organization } from '../types/compliance';

interface ComplianceTrendChartProps {
  organization: Organization;
  currentIsoScore: number;
  currentNistScore: number;
}

interface HistoricalDataPoint {
  month: string;
  isoScore: number;
  nistScore: number;
  milestone: string;
  checksPassing: number;
}

export const ComplianceTrendChart: React.FC<ComplianceTrendChartProps> = ({
  organization,
  currentIsoScore,
  currentNistScore
}) => {
  const [activeFilter, setActiveFilter] = useState<'both' | 'iso' | 'nist'>('both');
  const [showBenchmark, setShowBenchmark] = useState(true);

  // Generate 6-month historical progression tailored to the organization
  const getHistoricalData = (): HistoricalDataPoint[] => {
    if (organization.id === 'org-datapulse') {
      return [
        { month: 'May 2026', isoScore: 30, nistScore: 38, milestone: 'ISMS Scope & Google Admin initial gap analysis', checksPassing: 8 },
        { month: 'Jun 2026', isoScore: 45, nistScore: 50, milestone: 'Google Workspace 2SV enforced for 118 users', checksPassing: 13 },
        { month: 'Jul 2026', isoScore: 62, nistScore: 68, milestone: 'GitHub branch protection & Dependabot enabled', checksPassing: 18 },
        { month: 'Aug 2026', isoScore: 70, nistScore: 76, milestone: 'BigQuery audit logs exported & storage encryption verified', checksPassing: 21 },
        { month: 'Sep 2026', isoScore: 78, nistScore: 84, milestone: 'Core policies approved & super admin accounts restricted', checksPassing: 24 },
        { month: 'Oct 2026', isoScore: currentIsoScore, nistScore: currentNistScore, milestone: 'Active Continuous Posture · 25/28 checks passing', checksPassing: 25 },
      ];
    } else if (organization.id === 'org-finvault') {
      return [
        { month: 'May 2026', isoScore: 40, nistScore: 46, milestone: 'Cloud banking boundary & PCI DSS baseline audit', checksPassing: 11 },
        { month: 'Jun 2026', isoScore: 55, nistScore: 60, milestone: 'KMS HSM key hierarchy & TLS 1.3 enforced', checksPassing: 16 },
        { month: 'Jul 2026', isoScore: 66, nistScore: 72, milestone: 'M365 & Google Workspace dual connectors live', checksPassing: 19 },
        { month: 'Aug 2026', isoScore: 72, nistScore: 78, milestone: 'Quarterly access reviews & third-party risk review', checksPassing: 22 },
        { month: 'Sep 2026', isoScore: 80, nistScore: 85, milestone: 'Multi-tenant row-level security audit passed', checksPassing: 25 },
        { month: 'Oct 2026', isoScore: currentIsoScore, nistScore: currentNistScore, milestone: 'Active Continuous Posture · Stage 1 Readiness', checksPassing: 26 },
      ];
    } else {
      // Default: HealthBridge Technologies
      return [
        { month: 'May 2026', isoScore: 34, nistScore: 40, milestone: 'Digital health ISMS boundary & gap analysis', checksPassing: 9 },
        { month: 'Jun 2026', isoScore: 48, nistScore: 52, milestone: 'M365 & GitHub connectors connected · MFA campaign', checksPassing: 14 },
        { month: 'Jul 2026', isoScore: 58, nistScore: 65, milestone: 'Information Security Policy approved · Secret scanning', checksPassing: 17 },
        { month: 'Aug 2026', isoScore: 67, nistScore: 74, milestone: 'Intune MDM BitLocker enrolled · Legacy auth blocked', checksPassing: 20 },
        { month: 'Sep 2026', isoScore: 75, nistScore: 82, milestone: 'Access Control Policy approved · SSPR multi-factor active', checksPassing: 23 },
        { month: 'Oct 2026', isoScore: currentIsoScore, nistScore: currentNistScore, milestone: 'Active Posture · Sprint 1 admin demotion in progress', checksPassing: 25 },
      ];
    }
  };

  const data = getHistoricalData();
  const baselineStartIso = data[0].isoScore;
  const baselineStartNist = data[0].nistScore;
  const isoGain = currentIsoScore - baselineStartIso;
  const nistGain = currentNistScore - baselineStartNist;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload as HistoricalDataPoint;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs max-w-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200">{label}</span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              {pointData.checksPassing}/28 Checks Passing
            </span>
          </div>

          <div className="space-y-1">
            {(activeFilter === 'both' || activeFilter === 'iso') && (
              <div className="flex items-center justify-between">
                <span className="text-indigo-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>ISO/IEC 27001:2022:</span>
                </span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {pointData.isoScore}%
                </span>
              </div>
            )}

            {(activeFilter === 'both' || activeFilter === 'nist') && (
              <div className="flex items-center justify-between">
                <span className="text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>NIST CSF 2.0:</span>
                </span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {pointData.nistScore}%
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span className="text-slate-300 font-semibold block mb-0.5">Key Milestone:</span>
            <span>{pointData.milestone}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Historical Posture Telemetry</span>
            <span aria-hidden="true">·</span>
            <span>6-Month Continuous Progression</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-emerald-600 tabular-nums">+{isoGain}% Total Improvement</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Compliance Readiness Trend (Last 6 Months)</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Audit trajectory for <strong className="text-slate-800">{organization.name}</strong> from initial gap assessment to current active posture.
          </p>
        </div>

        {/* Chart View Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveFilter('both')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFilter === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Both Frameworks
            </button>
            <button
              onClick={() => setActiveFilter('iso')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFilter === 'iso' ? 'bg-white text-indigo-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ISO 27001
            </button>
            <button
              onClick={() => setActiveFilter('nist')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFilter === 'nist' ? 'bg-white text-emerald-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NIST CSF 2.0
            </button>
          </div>

          <button
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showBenchmark
                ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle 80% Stage 1 Audit Readiness Benchmark Line"
          >
            <span>80% Target Line</span>
          </button>
        </div>
      </div>

      {/* Trend Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
        <div>
          <span className="text-[11px] text-slate-500 font-medium">May 2026 Baseline</span>
          <div className="text-xl font-bold text-slate-800 tabular-nums mt-0.5">
            {baselineStartIso}% <span className="text-xs text-slate-400 font-normal">ISO</span> / {baselineStartNist}% <span className="text-xs text-slate-400 font-normal">NIST</span>
          </div>
          <span className="text-[10px] text-slate-500">Initial Gap Audit</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-500 font-medium">Current Readiness</span>
          <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
            {currentIsoScore}% <span className="text-xs text-indigo-600 font-medium">ISO</span> / {currentNistScore}% <span className="text-xs text-emerald-600 font-medium">NIST</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Live Evidence Verified</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-500 font-medium">Monthly Velocity</span>
          <div className="text-xl font-bold text-emerald-600 tabular-nums mt-0.5 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" />
            <span>+{(isoGain / 5).toFixed(1)}%</span>
          </div>
          <span className="text-[10px] text-slate-500">Avg. monthly score gain</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-500 font-medium">Stage 1 Audit Gate</span>
          <div className="text-xl font-bold text-indigo-700 tabular-nums mt-0.5">
            {currentIsoScore >= 80 ? 'Qualified' : 'In Progress'}
          </div>
          <span className="text-[10px] text-slate-500">80% threshold exceeded</span>
        </div>
      </div>

      {/* Recharts LineChart */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 25, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              dy={6}
            />
            <YAxis
              domain={[20, 100]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              formatter={(value) => (
                <span className="text-xs font-medium text-slate-700">
                  {value === 'isoScore' ? 'ISO/IEC 27001:2022' : 'NIST CSF 2.0'}
                </span>
              )}
            />

            {showBenchmark && (
              <ReferenceLine
                y={80}
                stroke="#6366f1"
                strokeDasharray="4 4"
                label={{
                  value: 'Stage 1 Audit Benchmark (80%)',
                  fill: '#4338ca',
                  fontSize: 10,
                  position: 'insideBottomRight'
                }}
              />
            )}

            {(activeFilter === 'both' || activeFilter === 'iso') && (
              <Line
                type="monotone"
                dataKey="isoScore"
                name="isoScore"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}

            {(activeFilter === 'both' || activeFilter === 'nist') && (
              <Line
                type="monotone"
                dataKey="nistScore"
                name="nistScore"
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Scores reflect verified evidence from connected M365, Google Workspace, and GitHub connectors.</span>
        </span>
        <span className="font-mono tabular-nums text-[11px] text-slate-600">
          Last continuous check evaluated: Today
        </span>
      </div>

    </div>
  );
};
