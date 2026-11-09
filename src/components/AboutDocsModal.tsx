import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  ShieldCheck, 
  BookOpen,
  Award,
  X
} from 'lucide-react';
import { ACADEMIC_REPORT_DATA } from '../academicReportData';

interface AboutDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDocsModal: React.FC<AboutDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'risks' | 'usecases' | 'doc'>('overview');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" dir="ltr">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Bar */}
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Engineering Specification
                </span>
                <span className="text-xs text-slate-400">AYBOS v1.0.0 Architecture</span>
              </div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                About & System Documentation
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition h-9"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Architecture & Scope</span>
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'plan'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>14-Week Roadmap & Sprints</span>
          </button>
          <button
            onClick={() => setActiveTab('risks')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'risks'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Risk Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('usecases')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'usecases'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Numbered Use Cases (UC 01–13)</span>
          </button>
          <button
            onClick={() => setActiveTab('doc')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'doc'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Technical Report</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#0F172A] to-slate-900 text-white rounded-xl p-6 shadow-xs border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800/50">
                    Retail Operations Architecture
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{ACADEMIC_REPORT_DATA.academicYear}</span>
                </div>
                <h1 className="text-xl font-bold mb-1 text-white">
                  {ACADEMIC_REPORT_DATA.titleEnglish}
                </h1>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  A high-throughput, single-tenant supermarket management system engineered for high transactional integrity, strict relational consistency, and sub-120ms POS checkout latency.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/50 p-3.5 rounded-lg border border-slate-800">
                  <div>
                    <div className="text-slate-400 text-xs">Primary Pattern:</div>
                    <div className="font-semibold text-white">Layered Monolith (3NF)</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Methodology:</div>
                    <div className="font-semibold text-white">Agile Scrum + XP</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Delivery Cadence:</div>
                    <div className="font-semibold text-white">14 Weeks (7 Sprints)</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Core Scope:</div>
                    <div className="font-semibold text-emerald-400">7 Operational Modules</div>
                  </div>
                </div>
              </div>

              {/* Scope & Boundaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>In-Scope (7 Core Modules)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {ACADEMIC_REPORT_DATA.scope.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Explicit Exclusions (Out of Scope)</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    Excluded to guarantee an ultra-stable, zero-defect transactional core:
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span>Advanced AI & Machine Learning predictive forecasting</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span>Multi-tenant SaaS subscription billing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span>Computer vision automated checkout cameras</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span>Customer-facing e-commerce storefronts</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* KPIs Table */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Measured Empirical Key Performance Indicators</span>
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    All Targets Surpassed
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="py-2 px-3 font-semibold">Metric</th>
                        <th className="py-2 px-3 font-semibold">Target</th>
                        <th className="py-2 px-3 font-semibold">Empirical Result</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ACADEMIC_REPORT_DATA.kpis.map((kpi, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">{kpi.metric}</td>
                          <td className="py-2 px-3 text-slate-600">{kpi.target}</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700">{kpi.achieved}</td>
                          <td className="py-2 px-3">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {kpi.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GANTT & SPRINT SCHEDULE */}
          {activeTab === 'plan' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white rounded-xl p-4 font-mono text-xs overflow-x-auto shadow-inner">
                <div className="text-emerald-400 font-bold mb-2 flex items-center justify-between">
                  <span>AYBOS 14-Week Gantt Schedule</span>
                  <span className="text-slate-400 font-normal">W01 – W14</span>
                </div>
                <pre className="text-slate-300 leading-relaxed text-xs">
{`Activity / Task Name           W01 W02 W03 W04 W05 W06 W07 W08 W09 W10 W11 W12 W13 W14  Dependencies
--------------------------------------------------------------------------------------------------
[Sprint 0] Tooling & CI/CD      [===]                                                 None
[Sprint 0] Relational DB DDL    [===]                                                 None
[Sprint 1] Authentication & RBAC      [===]                                           Sprint 0
[Sprint 1] Product Catalog & SKU           [===]                                      DB Schema
[Sprint 2] Stock Balances & Suppliers           [===]                                 Sprint 1
[Sprint 3] POS UI & Cart Engine                      [===]                            Sprint 1, 2
[Sprint 4] Purchase Orders & Receiving                    [===]                       Sprint 2
[Sprint 5] Loss Adjustments & Reports                          [===]                  Sprint 3, 4
[Sprint 6] Security Audit & Launch                                   [===]            All Modules`}
                </pre>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2.5 px-3">Sprint</th>
                      <th className="py-2.5 px-3">Timeframe</th>
                      <th className="py-2.5 px-3">Core Modules & Technical Focus</th>
                      <th className="py-2.5 px-3">Accepted Deliverables</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ACADEMIC_REPORT_DATA.sprintSchedule.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-emerald-800 font-mono">{s.sprint}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{s.weeks}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{s.focus}</td>
                        <td className="py-2.5 px-3 text-slate-600">{s.deliverable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: RISKS */}
          {activeTab === 'risks' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Risk Description</th>
                      <th className="py-2.5 px-2 text-center">Likelihood</th>
                      <th className="py-2.5 px-2 text-center">Impact</th>
                      <th className="py-2.5 px-2 text-center">Score</th>
                      <th className="py-2.5 px-3">Mitigation Strategy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ACADEMIC_REPORT_DATA.riskMatrix.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{r.id}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {r.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{r.desc}</td>
                        <td className="py-2.5 px-2 text-center font-mono">{r.likelihood}</td>
                        <td className="py-2.5 px-2 text-center font-mono">{r.impact}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                            r.level === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.score}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 leading-relaxed">{r.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: USE CASES */}
          {activeTab === 'usecases' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ACADEMIC_REPORT_DATA.useCases.map((uc) => (
                <div key={uc.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {uc.id}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      uc.priority === 'Must Have' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {uc.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">{uc.name}</h4>
                  <div className="text-xs text-slate-500 mb-1">Actor: <span className="font-semibold text-slate-700">{uc.actor}</span></div>
                  <p className="text-xs text-slate-600 leading-relaxed">{uc.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: DOCUMENT PREVIEW */}
          {activeTab === 'doc' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 leading-relaxed text-xs text-slate-800 font-sans space-y-4">
              <h3 className="text-base font-bold text-slate-900">Executive Summary</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                The AYBOS platform pairs Agile Scrum with Extreme Programming (XP) to guarantee delivery of a resilient retail core. Automated test coverage exceeds 86%, while atomic database transactions safeguard physical stock deductions across multi-till checkout lines.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-600">
          <div>Official Specification & Documentation Guide</div>
          <div className="font-semibold text-slate-800">AYBOS v1.0.0 Production Core</div>
        </div>

      </div>
    </div>
  );
};
