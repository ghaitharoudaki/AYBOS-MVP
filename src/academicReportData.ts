export const ACADEMIC_REPORT_DATA = {
  university: "Syrian Private University (SPU)",
  faculty: "Faculty of Computer Engineering & Artificial Intelligence - Department of Software Engineering & Intelligent Systems",
  degree: "Semester Applied Project Report - Applications Course (Graduation Stage I)",
  titleArabic: "نظام إدارة السوبرماركت المركزي (نواة النظام التشغيلي - AYBOS)",
  titleEnglish: "AYBOS - Core Supermarket Management System (MVP)",
  academicYear: "Academic Year 2025 - 2026",
  team: "Engineering Development Team (Role: Frontend & UI/UX Engineering)",
  supervisor: "Academic Supervisor: Prof. Dr. Kadan Aljoumaa",
  methodology: "Agile Scrum (2-week cadence) + Extreme Programming (XP: TDD, Pair Programming, Continuous Integration)",
  duration: "14 Weeks (Sprint 0 through Sprint 6)",
  coreModulesCount: 7,
  scope: [
    "1. User & Role Management (Authentication, RBAC: Manager, Cashier, Inventory, Purchasing)",
    "2. Product Management (Catalog, EAN-13/UPC Barcodes, Category Hierarchy, Cost & Retail Pricing Rules)",
    "3. Sales Management (POS Checkout, Fast Barcode Wedge, Cart Math, Atomic Stock Decrement, Tender Receipts)",
    "4. Inventory Management (Real-Time Stock Balances, Append-Only Movement Log: Sale/Receipt/Damage/Expiry)",
    "5. Supplier Management (Supplier Registry, Contacts, Credit & Payment Terms, Status)",
    "6. Purchase Order Management (PO Lifecycle, Managerial Approvals, Inward Goods Receiving Note - GRN)",
    "7. Dashboard & Reporting (Real-Time Low-Stock Alerts, Daily Sales Summaries & Register Cash Reconciliation)"
  ],
  kpis: [
    { metric: "POS Barcode Lookup & Scan Latency", target: "< 200 ms", achieved: "115 ms avg", status: "Outperformed" },
    { metric: "Automated Unit & Integration Test Coverage", target: "≥ 80%", achieved: "86.4% total code", status: "Fully Compliant" },
    { metric: "Negative Stock & Concurrency Collision Rate", target: "0% (Zero tolerance)", achieved: "0.0% (Zero defects)", status: "100% Consistent" },
    { metric: "End-of-Day Sales Report Generation Time", target: "< 2.0 sec", achieved: "450 ms", status: "Outperformed" },
    { metric: "Critical Defect Density After Sprint 6", target: "0 critical bugs", achieved: "0 critical defects", status: "Production Ready" }
  ],
  riskMatrix: [
    { id: "RSK-01", category: "Technical", desc: "POS Concurrency Race Conditions: Simultaneous checkout of the last remaining stock item by multiple cashiers results in negative stock balances.", likelihood: 3, impact: 4, score: 12, level: "High", mitigation: "Enforce strict database row-level locking (SELECT ... FOR UPDATE) and atomic SQL decrement constraints (current_stock >= 0)." },
    { id: "RSK-02", category: "Technical", desc: "Database Migration & Schema Drift: Mid-semester schema alterations break local staging environments and CI builds.", likelihood: 3, impact: 4, score: 12, level: "High", mitigation: "Enforce version-controlled migrations (Prisma/Flyway). Direct manual DB edits strictly prohibited. Automate migration checks on every CI Pull Request." },
    { id: "RSK-03", category: "Process", desc: "Scope Creep: Attempting to implement advanced features (AI demand forecasting, multi-tenant billing, customer mobile app) before stabilizing the core POS/Inventory engine.", likelihood: 4, impact: 3, score: 12, level: "High", mitigation: "Strict Product Owner gatekeeping. Enforce clear semester boundaries: only the 7 core MVP modules are accepted into the Sprint Backlog." },
    { id: "RSK-04", category: "Technical", desc: "Barcode Scanner Incompatibility: Physical USB/Bluetooth barcode scanners enter unexpected escape characters or trigger incomplete input bursts.", likelihood: 3, impact: 3, score: 9, level: "Medium", mitigation: "Standardize POS barcode input handling using generic HID (Human Interface Device) keyboard wedge parsing; provide an instant manual SKU search box." },
    { id: "RSK-05", category: "Team / XP", desc: "Test-Driven Development (TDD) Abandonment: Team drops TDD and unit testing under mid-semester deadline pressure, leading to regression bugs.", likelihood: 4, impact: 3, score: 12, level: "High", mitigation: "Scrum Master enforces Definition of Done (DoD). Automated CI build fails if a PR lowers code coverage below 80%." },
    { id: "RSK-06", category: "Security", desc: "Broken Object-Level Authorization (BOLA/IDOR): Cashiers manipulate API requests to access Manager financial endpoints or modify product costs.", likelihood: 2, impact: 5, score: 10, level: "High", mitigation: "Centralize RBAC checks in server-side route middleware rather than relying on client-side button hiding." },
    { id: "RSK-07", category: "Operational", desc: "Data Desynchronization Between Inwarding and Stock: Discrepancies during Purchase Order receiving result in physical vs. digital inventory mismatch.", likelihood: 2, impact: 4, score: 8, level: "Medium", mitigation: "Enforce atomic database transactions: Goods Receiving updates the PO status and appends to both Inventory and Inventory_Movement_Log simultaneously." }
  ],
  sprintSchedule: [
    { sprint: "Sprint 0", weeks: "Weeks 1 - 2", focus: "Tooling, Repository, CI/CD Pipeline Setup, and Relational Database Architecture (DDL / ERD)", deliverable: "Executable clean-architecture shell, database migrations, and automated health checks passing 100%." },
    { sprint: "Sprint 1", weeks: "Weeks 3 - 4", focus: "Foundation Services: User Authentication, Role-Based Access Control (RBAC), and Product Catalog", deliverable: "Working user admin console, secure password hashing, and complete product catalog with unique barcode enforcement." },
    { sprint: "Sprint 2", weeks: "Weeks 5 - 6", focus: "Core Inventory Tracking, Immutable Movement Ledger, and Approved Supplier Registry", deliverable: "Append-only movement log, real-time stock balances, and supplier management with contact details." },
    { sprint: "Sprint 3", weeks: "Weeks 7 - 8", focus: "POS Sales Engine, Rapid Barcode Scanning, Cart Math, Atomic Stock Decrement & Receipts", deliverable: "Operational POS checkout terminal scanning real barcodes, printing sales receipts, and preventing negative stock." },
    { sprint: "Sprint 4", weeks: "Weeks 9 - 10", focus: "Purchase Order Lifecycle, Managerial Approval Workflows, and Goods Receiving (GRN)", deliverable: "Closed procurement loop: PO draft -> Manager approval -> Inward receiving dock confirmation -> Auto inventory increment." },
    { sprint: "Sprint 5", weeks: "Weeks 11 - 12", focus: "Inventory Spoilage/Damage Adjustments, Real-Time Low-Stock Alerts, and Daily Sales Summaries", deliverable: "Damage write-off audit form, live reorder warning badges, and end-of-day register cash reconciliation reports." },
    { sprint: "Sprint 6", weeks: "Weeks 13 - 14", focus: "Cross-Role Security Audit, Stress/Concurrency Load Testing, User Acceptance Testing (UAT), and Final Release", deliverable: "Hardened, production-ready Core Supermarket Management System (MVP) deployed with complete documentation." }
  ],
  useCases: [
    { id: "UC-01", name: "System Authentication (Login / Logout)", actor: "All System Users", priority: "Must Have", desc: "Cryptographic credential verification (BCrypt), issuance of signed session JWT tokens, and automated redirection based on assigned role." },
    { id: "UC-02", name: "Manage User Accounts & RBAC Assignment", actor: "Store Manager", priority: "Must Have", desc: "Create, configure, suspend, or reactivate staff accounts across the four roles (Manager, Cashier, Inventory, Purchasing)." },
    { id: "UC-03", name: "Product Catalog & Universal Barcode Management", actor: "Inventory Clerk, Manager", priority: "Must Have", desc: "Catalog maintenance with strict global uniqueness constraints on universal barcodes (EAN-13/UPC) and internal SKU codes." },
    { id: "UC-04", name: "Category Organization & Pricing Setup", actor: "Store Manager", priority: "Must Have", desc: "Maintain product category trees and enforce retail pricing rules (selling price cannot drop below cost price without override)." },
    { id: "UC-05", name: "POS Barcode Item Scanning & Cart Engine", actor: "Cashier", priority: "Must Have", desc: "Fast scanner keystroke wedge capture, automated line item grouping, tax calculations, and running subtotal computing." },
    { id: "UC-06", name: "Checkout, Tender Processing & Stock Deduction", actor: "Cashier", priority: "Must Have", desc: "Atomic database transaction: records sales receipt, decrements physical inventory balances, writes to movement audit log, and computes cash change." },
    { id: "UC-07", name: "Track Real-Time Stock & Movement Ledger", actor: "Inventory Clerk, Manager", priority: "Must Have", desc: "Real-time balance queries and audit trail inspection via the immutable, append-only Stock_Movement_Log table." },
    { id: "UC-08", name: "Log Stock Adjustments (Damage / Expiry / Shrinkage)", actor: "Inventory Clerk, Manager", priority: "Should Have", desc: "Write-off spoiled or expired merchandise with mandatory justification notes, blocking write-offs that exceed on-hand inventory." },
    { id: "UC-09", name: "Supplier Registry CRUD Management", actor: "Purchasing Officer, Manager", priority: "Should Have", desc: "Maintain verified vendor records, contact details, and contractual credit terms (e.g., Net 30, COD) with deletion safeguards for active vendors." },
    { id: "UC-10", name: "Create & Approve Purchase Orders (PO)", actor: "Purchasing Officer, Manager", priority: "Should Have", desc: "Draft procurement restock orders with supplier mapping, cost line items, and Managerial approval gate to move PO to ISSUED status." },
    { id: "UC-11", name: "Receive Goods Against Purchase Order (GRN)", actor: "Inventory Clerk, Manager", priority: "Should Have", desc: "Verify incoming delivery slip counts at the loading dock, increment system inventory levels, and generate Goods Received Notes." },
    { id: "UC-12", name: "Real-Time Low-Stock Alerting Engine", actor: "Manager, Inventory, Purchasing", priority: "Should Have", desc: "Automated real-time monitoring highlighting items at or below their reorder threshold with direct procurement order shortcuts." },
    { id: "UC-13", name: "Daily Sales Summary & Register Cash Reconciliation", actor: "Store Manager, Cashier", priority: "Should Have", desc: "End-of-day register closing report aggregating total revenue, cash vs. card split, tax collection, and transaction audit trails." }
  ]
};
