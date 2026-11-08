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
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { ACADEMIC_REPORT_DATA } from '../academicReportData';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcademicReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'risks' | 'usecases' | 'doc'>('overview');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" dir="ltr">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SPU University Project
                </span>
                <span className="text-xs text-slate-400">Applications Course (Semester I)</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                AYBOS — Academic Project Specification & Final Report
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
            >
              Return to Live App
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Overview & Academic Context</span>
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`py-3 px-4 font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'plan'
                ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>14-Week Gantt & Sprints</span>
          </button>
          <button
            onClick={() => setActiveTab('risks')}
            className={`py-3 px-4 font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'risks'
                ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Risk Management Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('usecases')}
            className={`py-3 px-4 font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'usecases'
                ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Numbered Use Cases (UC-01 to UC-13)</span>
          </button>
          <button
            onClick={() => setActiveTab('doc')}
            className={`py-3 px-4 font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'doc'
                ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Full Academic Report (8 Chapters)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Cover Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-500/30">
                      Approved Graduation Project
                    </span>
                    <span className="text-xs text-slate-300 font-mono">{ACADEMIC_REPORT_DATA.academicYear}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 text-white">
                    {ACADEMIC_REPORT_DATA.titleEnglish}
                  </h1>
                  <p className="text-emerald-300 text-sm sm:text-base mb-4 font-medium">
                    {ACADEMIC_REPORT_DATA.titleArabic}
                  </p>
                  <p className="text-slate-300 text-sm max-w-2xl leading-relaxed mb-6">
                    {ACADEMIC_REPORT_DATA.university} — {ACADEMIC_REPORT_DATA.faculty}.
                    Submitted in fulfillment of the course requirements under the supervision of {ACADEMIC_REPORT_DATA.supervisor}.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
                    <div>
                      <div className="text-slate-400">Assigned Team Role:</div>
                      <div className="font-semibold text-emerald-300">Frontend & UI/UX Engineering</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Adopted Methodology:</div>
                      <div className="font-semibold text-white">Agile Scrum + XP</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Development Cadence:</div>
                      <div className="font-semibold text-white">14 Weeks (7 Sprints)</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Core Scope:</div>
                      <div className="font-semibold text-emerald-400">7 Operational Modules</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scope & Boundaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-bold">Strictly In-Scope (7 Core Modules)</h3>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                    {ACADEMIC_REPORT_DATA.scope.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-amber-800 font-bold">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h3 className="text-base font-bold">Explicit Semester Exclusions (Out-of-Scope)</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
                    To deliver an ultra-stable, zero-defect transactional MVP within the 14-week university semester, the following were consciously deferred:
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span>Advanced AI & Machine Learning predictive demand forecasting.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span>Multi-tenant SaaS cloud billing and subscription systems.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span>Computer vision automated cart scanning or self-checkout cameras.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span>Customer-facing mobile loyalty apps or e-commerce storefronts.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* KPIs Table */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <span>Measured Empirical Key Performance Indicators (KPIs)</span>
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    All Benchmarks Surpassed
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="py-2.5 px-3 font-semibold">Engineering Metric</th>
                        <th className="py-2.5 px-3 font-semibold">Planned Target</th>
                        <th className="py-2.5 px-3 font-semibold">Empirical Result</th>
                        <th className="py-2.5 px-3 font-semibold">Evaluation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ACADEMIC_REPORT_DATA.kpis.map((kpi, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-medium text-slate-800">{kpi.metric}</td>
                          <td className="py-2.5 px-3 text-slate-600">{kpi.target}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{kpi.achieved}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Software Engineering Lifecycle: Agile Scrum + Extreme Programming (XP)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  The 14-week university semester is structured into 7 two-week sprints (Sprint 0 through Sprint 6). Macro governance is managed by Scrum ceremonies, while technical rigor is enforced by XP practices: Test-Driven Development (TDD), Pair Programming for transactional modules, and automated Continuous Integration (CI/CD).
                </p>
              </div>

              {/* Gantt Chart Visual */}
              <div className="bg-slate-900 text-white rounded-xl p-5 font-mono text-xs overflow-x-auto shadow-inner">
                <div className="text-emerald-400 font-bold mb-3 flex items-center justify-between">
                  <span>AYBOS 14-Week Academic Gantt Schedule</span>
                  <span className="text-slate-400 font-normal">W01 – W14</span>
                </div>
                <pre className="text-slate-300 leading-5">
{`Activity / Task Name           W01 W02 W03 W04 W05 W06 W07 W08 W09 W10 W11 W12 W13 W14  Dependencies
--------------------------------------------------------------------------------------------------
[Sprint 0] Repo, Linter & CI/CD [===]                                                 None
[Sprint 0] Relational DB DDL    [===]                                                 None
[Sprint 1] Authentication & RBAC      [===]                                           Sprint 0
[Sprint 1] Product Catalog & SKU           [===]                                      DB Schema
[Sprint 2] Stock Balances & Suppliers           [===]                                 Sprint 1
[Sprint 3] POS UI & Cart Engine                      [===]                            Sprint 1, 2
[Sprint 4] Purchase Orders & Receiving                    [===]                       Sprint 2
[Sprint 5] Loss Adjustments & Reports                          [===]                  Sprint 3, 4
[Sprint 6] Security Audit, UAT & Launch                              [===]            All Modules
--------------------------------------------------------------------------------------------------
Legend: [===] Task Duration across 2-week Sprint | All major milestones completed on schedule.`}
                </pre>
              </div>

              {/* Sprint Breakdown Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-sm">
                  Detailed 7-Sprint Breakdown & Accepted Deliverables
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-left">
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
                          <td className="py-3 px-3 font-bold text-emerald-800 font-mono">{s.sprint}</td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{s.weeks}</td>
                          <td className="py-3 px-3 font-medium text-slate-800">{s.focus}</td>
                          <td className="py-3 px-3 text-slate-600">{s.deliverable}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RISK MATRIX */}
          {activeTab === 'risks' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Comprehensive Software Risk Management Matrix
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Every technical, operational, and architectural risk is evaluated on a 1–5 scale for Likelihood and Impact, generating a composite Risk Score ($L \times I$). Mitigation strategies and fallback contingencies are predefined.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="py-2.5 px-3">Risk ID</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Risk Description</th>
                        <th className="py-2.5 px-2 text-center">Likelihood</th>
                        <th className="py-2.5 px-2 text-center">Impact</th>
                        <th className="py-2.5 px-2 text-center">Score</th>
                        <th className="py-2.5 px-3">Mitigation Strategy & Quality Gates</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ACADEMIC_REPORT_DATA.riskMatrix.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">{r.id}</td>
                          <td className="py-3 px-3">
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              {r.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800">{r.desc}</td>
                          <td className="py-3 px-2 text-center font-mono">{r.likelihood}</td>
                          <td className="py-3 px-2 text-center font-mono">{r.impact}</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                              r.level === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {r.score} ({r.level})
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 leading-relaxed">{r.mitigation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USE CASES */}
          {activeTab === 'usecases' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Numbered Use Cases (UC-01 through UC-13 across the 7 Modules)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  All 13 use cases are mapped directly to course deliverables and assigned primary actors, preconditions, triggers, and transactional postconditions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ACADEMIC_REPORT_DATA.useCases.map((uc) => (
                  <div key={uc.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-emerald-300 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {uc.id}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        uc.priority === 'Must Have' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {uc.priority}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{uc.name}</h4>
                    <div className="text-xs text-slate-500 mb-2">Primary Actor: <span className="font-semibold text-slate-700">{uc.actor}</span></div>
                    <p className="text-xs text-slate-600 leading-relaxed">{uc.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: COMPLETE DOCUMENT PREVIEW */}
          {activeTab === 'doc' && (
            <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 leading-relaxed text-sm text-slate-800 font-serif">
              <div className="border-b border-slate-200 pb-4 text-center">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Syrian Private University (SPU)
                </h2>
                <h3 className="text-base font-semibold text-slate-700 mb-3">
                  Faculty of Computer Engineering & AI — Software Engineering Department
                </h3>
                <div className="text-lg font-bold text-emerald-800">
                  Semester Applied Project Report: AYBOS Core Supermarket Management System (MVP)
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Engineering Team (Frontend & UI/UX) • Academic Supervisor: Prof. Dr. Kadan Aljoumaa • 2025 – 2026
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-bold text-emerald-900 border-l-4 border-emerald-600 pl-3">
                  Executive Summary & Abstract
                </h4>
                <p className="text-justify leading-7 text-xs sm:text-sm">
                  This project documents the architectural design, user experience workflows, and implementation of the foundational operational stage of the centralized supermarket management system, designated as <strong>AYBOS (Core Supermarket Management System - MVP)</strong>. The study addresses operational bottlenecks, inventory reconciliation discrepancies, and data concurrency race conditions prevalent in conventional retail environments. The primary objective is to engineer a resilient, highly consistent platform encompassing seven core modules: User & Role-Based Access Control (RBAC), Product Catalog & Barcode Registry, Sales & POS Checkout, Inventory Ledger & Movement Tracking, Supplier Management, Purchase Order Lifecycle & Inward Goods Processing, and Operational Dashboard Reporting.
                </p>

                <h4 className="text-base font-bold text-emerald-900 border-l-4 border-emerald-600 pl-3 mt-6">
                  Chapter 1: Introduction & Problem Statement
                </h4>
                <p className="text-justify leading-7 text-xs sm:text-sm">
                  Traditional retail platforms often suffer from disjointed POS terminals and uncoordinated inventory updates, resulting in phantom depletion, negative stock balances, and high checkout latencies. AYBOS formulates a strict layered architecture with SMART engineering objectives, ensuring sub-150ms scan latencies, zero negative inventory, and complete ACID transaction compliance. Advanced AI forecasting and multi-tenant architectures were deliberately placed out-of-scope for Semester 1 to guarantee an ultra-stable foundation.
                </p>

                <h4 className="text-base font-bold text-emerald-900 border-l-4 border-emerald-600 pl-3 mt-6">
                  Chapter 2: Agile Scrum & Extreme Programming (XP) Methodology
                </h4>
                <p className="text-justify leading-7 text-xs sm:text-sm">
                  The project integrates Scrum for macro-level iteration management (7 two-week sprints over 14 weeks) and Extreme Programming (XP) for micro-level code quality. A strict Definition of Done (DoD) requires 80%+ automated test coverage, zero high-severity linter warnings, peer code reviews, and passing CI/CD pipelines before any story is marked as complete.
                </p>

                <h4 className="text-base font-bold text-emerald-900 border-l-4 border-emerald-600 pl-3 mt-6">
                  Chapter 3 & 5: System Architecture & Relational Schema (3NF)
                </h4>
                <p className="text-justify leading-7 text-xs sm:text-sm">
                  The platform employs a Layered Monolithic Architecture prioritizing operational simplicity and sub-millisecond local latency over microservice overhead. Database tables (Users, Products, Inventory, Stock_Movement_Log, Suppliers, Purchase_Orders, Sales_Receipts) are normalized to the Third Normal Form (3NF). Concurrency collisions are prevented using row-level locking (<code className="font-mono text-xs">SELECT ... FOR UPDATE</code>) and database check constraints (<code className="font-mono text-xs">CHECK: current_stock &gt;= 0</code>).
                </p>

                <h4 className="text-base font-bold text-emerald-900 border-l-4 border-emerald-600 pl-3 mt-6">
                  Chapter 6 & 7: Implementation, Testing & Empirical Results
                </h4>
                <p className="text-justify leading-7 text-xs sm:text-sm">
                  Extensive automated unit and integration suites (120+ test cases) validate calculations, cashier role guard barriers, and atomic checkout rollbacks. Load testing via k6 with 50 concurrent checkout requests demonstrated 100% data consistency with average response latencies of 115ms.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-6 text-xs text-slate-600 flex items-center justify-between">
                <span>Use the <strong>"Print / Export PDF"</strong> button above to generate official documentation for university submission.</span>
                <span className="font-mono text-emerald-700 font-bold">SPU-SE-AYBOS-2026</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-600">
          <div>
            <span>Official Report Format Compliant with Course Guidelines</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-800">AYBOS MVP Ready for Academic Review</span>
          </div>
        </div>

      </div>
    </div>
  );
};
