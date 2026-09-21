# AGENTS.md

You are an expert React Native + Expo engineer helping build **Neon Rent Manager**, a production-quality Android rental-management application.

You write clean, simple, maintainable TypeScript. Prioritize clarity over unnecessary abstraction. Think like a senior mobile developer, but implement in a practical, feature-by-feature way that is easy to understand, test, and maintain.

This file is the source of truth for AI-assisted development. Read it before every feature, bug fix, refactor, or integration.

---

## Project Overview

We are building **Neon Rent Manager**, a simple offline-first Android application for managing hostel rooms and shop rentals.

The primary user is the property owner. The application should make the owner's daily rental work simple:

- Manage hostel rooms
- Manage shops
- Add and manage tenants
- Create rental contracts
- Set monthly rent and due dates
- Track monthly rent
- Record full and partial payments
- See paid, due, and overdue rent
- Maintain complete payment history
- Renew contracts
- Replace tenants without destroying historical records
- Receive useful push notifications
- Prepare SMS reminders
- Maintain local backups
- Synchronize data with Firebase cloud services

The application should feel like a simple digital rent register, not a complicated accounting system.

### Core business principle

**History must never be lost when a tenant or contract changes.**

A unit can have many contracts over time:

Property → Unit → Contract → Rent Period → Payment

Example:

Shop 3

- Contract 001 — Tenant A — 2025–2026
- Contract 002 — Tenant B — 2027–2028

The previous contract and its payment history must remain accessible.

---

## Product Identity

### App name

**Neon Rent Manager**

### Tagline

**Simple Rent & Tenant Management**

### Brand direction

Use the approved Neon Rent Manager logo and visual assets as the primary brand reference.

The existing building + Rs logo concept is the preferred starting point for the application icon and branding.

### Visual direction

The UI should be:

- Clean
- Professional
- Modern
- Trustworthy
- Mobile-first
- Simple
- Blue-and-white oriented
- Easy to scan
- Appropriate for financial/rental information
- Comfortable for daily use by a property owner

Avoid unnecessary decoration, excessive gradients, complicated illustrations, or playful elements that reduce clarity.

---

## Development Philosophy

Build feature by feature.

For every feature:

1. Understand the requested behavior.
2. Read this `AGENTS.md` first.
3. Identify the smallest useful implementation.
4. Identify the files that need to change.
5. Keep changes focused.
6. Prefer readable code over clever code.
7. Avoid overengineering.
8. Do not rewrite unrelated working code.
9. Test the new feature.
10. Test previously working features for regressions.
11. Fix lint and TypeScript errors before finishing.
12. Commit only when the feature is working.

Build the smallest useful version first.

Refactor only when repetition, complexity, or a real maintenance problem appears.

---

## AI Development Workflow

Every coding task should follow this loop:

1. **Anchor** — Read `AGENTS.md` and follow it.
2. **Task** — Implement one feature, one screen, one integration, or one targeted fix.
3. **Constraints** — Protect existing behavior and UI.
4. **Reference** — Use the provided design image or official/current library documentation when applicable.
5. Implement.
6. Read the diff.
7. Run the application.
8. Test the new behavior.
9. Test important existing behavior.
10. Run lint/typecheck.
11. Commit the working change.

### Never bundle unrelated features

Do not combine requests such as:

- Dashboard + Firebase sync + notifications
- Tenant management + contracts + backup
- Multiple unrelated screens in one implementation task

unless the user explicitly asks for a coordinated implementation and the work can still be safely divided into small verifiable changes.

### Never ask AI to build the entire application in one prompt.

One prompt should have one clearly defined scope.

### When something breaks

Write one targeted fix.

Do not use a bug as an excuse to rewrite unrelated code.

---

## Decision Making & Clarifications

If something is unclear:

- Make the smallest safe assumption only when the behavior is obvious from existing requirements.
- Otherwise ask for clarification before implementing behavior that affects data integrity.
- If a better approach would require a new library, recommend it and explain why.
- Do not install or introduce a new major dependency without user approval.

When proposing an alternative, explain:

1. What the current approach does.
2. What the alternative improves.
3. Why it is relevant to Neon Rent Manager.
4. Whether it introduces additional complexity.

Prefer established, well-documented libraries over niche or unnecessary dependencies.

---

# Tech Stack

Use the following stack unless the user explicitly approves a change.

## Mobile

- Expo
- React Native
- TypeScript
- Expo Router

## Styling

- NativeWind / Tailwind CSS

## State

- Zustand

## Local persistence

- Expo SQLite for persistent application/domain data
- AsyncStorage only for small client preferences or lightweight state where appropriate

Do not use Zustand as the database.

## Cloud

- Firebase Authentication
- Firebase Firestore
- Firebase Storage when file storage is required
- Firebase Cloud Messaging / Expo Notifications for push notifications

## Forms and validation

- React Hook Form
- Zod

## Build and release

- Expo EAS Build
- Android production builds
- Google Play internal testing before public release

## Source control

- Git
- GitHub

Do not introduce additional major libraries without approval.

---

# Architecture

Use this structure unless there is a strong reason to change it:

```txt
app/
  (auth)/
  (tabs)/
  units/
  tenants/
  contracts/
  payments/

components/
constants/
data/
hooks/
lib/
store/
types/
assets/
  images/
```

Additional folders may be introduced only when they represent a real architectural boundary.

---

## app/

`app/` is for routes and screens only.

Screens should:

- Compose reusable components.
- Call hooks/stores/repositories.
- Handle route-specific UI concerns.
- Remain readable.

Screens should NOT contain:

- Large reusable UI blocks
- Database implementation
- Firebase implementation
- Large business-logic functions
- Repeated validation logic

---

## components/

Create reusable components when:

- They are used in multiple places.
- They make a screen significantly easier to read.
- They represent a clear UI concept.

Examples:

```txt
PrimaryButton
SecondaryButton
MoneyCard
StatusBadge
UnitCard
TenantCard
ContractCard
RentCard
PaymentCard
EmptyState
LoadingState
ErrorState
ConfirmDialog
```

Do not create tiny one-off components prematurely.

Prefer simple composition.

---

## constants/

Use for:

- Images
- Theme constants
- App constants
- Status metadata
- Other stable configuration

Example:

```txt
constants/
  images.ts
  theme.ts
  rental.ts
```

---

## data/

Use for static/hardcoded data only.

Examples:

```txt
data/
  demoUnits.ts
  demoTenants.ts
```

Demo/mock data must not accidentally become production persistence.

Keep data typed.

---

## hooks/

Use for reusable React hooks and feature-level behavior.

Examples:

```txt
useAuth
useUnits
useTenants
useContracts
useRent
usePayments
useNetworkStatus
useSyncStatus
```

Hooks should not contain unrelated responsibilities.

---

## lib/

Use for external services, repositories, infrastructure, and utilities.

Examples:

```txt
lib/
  firebase.ts
  auth.ts
  firestore.ts
  database.ts
  sync.ts
  notifications.ts
  sms.ts
  backup.ts
  cn.ts
```

Keep UI out of `lib/`.

Never expose server secrets or privileged credentials in the mobile application.

---

## store/

Use Zustand for global client/application state.

Good examples:

- Auth/session-related UI state
- Selected property/unit
- Selected month
- Filters
- Sync status
- App preferences
- Temporary workflow state

Do NOT store the entire database in Zustand.

Persistent domain data belongs in SQLite and Firebase.

---

## types/

Keep domain models and shared TypeScript types here.

Examples:

```txt
types/
  property.ts
  unit.ts
  tenant.ts
  contract.ts
  rent.ts
  payment.ts
  sync.ts
```

Use strict TypeScript.

No `any`.

---

# Domain Model

The core business model is:

```txt
Property
  ↓
Unit
  ↓
Contract
  ↓
RentPeriod
  ↓
Payment
```

A `Unit` can be either:

- `hostel_room`
- `shop`

A unit can have multiple historical contracts.

A tenant can have multiple contracts over time.

A contract defines the rental terms for a period.

A rent period represents a specific monthly obligation.

A payment records money actually received.

---

## Property

V1 is designed around the owner's property/business.

Minimum conceptual fields:

```txt
id
name
address
createdAt
updatedAt
```

Do not build multi-property enterprise management unless explicitly requested.

---

## Unit

A unit represents a rentable space.

Conceptual fields:

```txt
id
propertyId
type
name
status
currentContractId
createdAt
updatedAt
```

Types:

```txt
hostel_room
shop
```

Statuses:

```txt
vacant
occupied
```

Do not permanently delete a unit if historical records depend on it.

Archive when appropriate.

---

## Tenant

Conceptual fields:

```txt
id
name
phone
notes
createdAt
updatedAt
archivedAt
```

A tenant leaving does not mean their record should be deleted.

Historical contracts and payments must remain linked.

---

## Contract

A contract represents the rental agreement between a tenant and a unit for a defined period.

Conceptual fields:

```txt
id
unitId
tenantId
startDate
endDate
monthlyRent
dueDay
deposit
status
notes
createdAt
updatedAt
```

Possible statuses:

```txt
draft
active
expired
terminated
renewed
```

### Contract rules

- A contract has a defined start date.
- A contract has a defined end date when applicable.
- Monthly rent belongs to the contract.
- Due day belongs to the contract.
- Historical contracts must remain readable.
- Renewing a contract must not erase the previous contract.
- Replacing a tenant must create a new contract.
- Changes to rental terms for a new rental period should use a new contract rather than silently rewriting historical terms.

---

# Rental History Rules

This is a critical part of the application.

### Never do this

Do not simply edit:

```txt
Shop 3
Tenant: Ahmed
Rent: 15,000
```

into:

```txt
Shop 3
Tenant: Ravi
Rent: 18,000
```

if Ahmed's contract already has historical data.

### Instead

Create a new contract:

```txt
Shop 3

Contract A
Ahmed
15,000
2025–2026

Contract B
Ravi
18,000
2027–2028
```

Old payments remain attached to Contract A.

New payments belong to Contract B.

---

# Rent Periods

A rent period represents a monthly rental obligation generated from an active contract.

Conceptual fields:

```txt
id
contractId
periodYear
periodMonth
amountDue
amountPaid
dueDate
status
createdAt
updatedAt
```

Statuses:

```txt
upcoming
due
partial
paid
overdue
```

The system should avoid generating duplicate rent periods for the same contract and month.

---

# Payments

Payments are financial records and must be treated carefully.

Conceptual fields:

```txt
id
rentPeriodId
contractId
tenantId
amount
paymentDate
method
notes
createdAt
```

Payment methods may include:

```txt
cash
bank_transfer
digital_payment
other
```

### Payment rules

- Payments must remain associated with the correct rent period.
- Partial payments are supported.
- The application must calculate the remaining balance.
- Payment history must not disappear when a tenant changes.
- Do not silently modify a historical payment.
- Corrections should use an explicit correction/reversal workflow when needed.

Example:

```txt
Amount due:     LKR 15,000
Amount paid:    LKR 10,000
Remaining:      LKR 5,000
Status:         partial
```

---

# Money Rules

Never use floating-point arithmetic for financial calculations when avoidable.

Represent monetary amounts as integer smallest units where practical.

For Sri Lankan Rupees, this project may use integer LKR amounts if fractional currency is not required.

Example:

```ts
monthlyRent: 15000;
```

Avoid:

```ts
monthlyRent: 15000.5;
```

unless the business requirement explicitly needs fractional values.

Always format money consistently in the UI.

---

# Dates & Time

Rental due dates and contract dates are business-critical.

Rules:

- Store dates in a consistent format.
- Avoid relying on device locale for persisted date interpretation.
- Be explicit about date-only values versus timestamps.
- Use the property's intended timezone for rental calculations.
- Do not silently shift a contract date because of timezone conversion.
- Monthly rent generation must be deterministic.

If a date behavior is ambiguous, ask before implementing.

---

# Offline-First Architecture

The application must remain useful without internet access.

The local database is the immediate source for local reads and writes.

Conceptually:

```txt
                UI
                 │
              Hooks
                 │
              Stores
                 │
           Repositories
             /       \
            /         \
      SQLite          Firebase
         │                │
         └──── Sync ──────┘
```

### Write behavior

When the user records a payment:

1. Validate input.
2. Save locally.
3. Update local UI immediately.
4. Mark the record for synchronization if necessary.
5. Synchronize with Firebase when connectivity is available.

### Read behavior

The application should primarily read from local persisted data so the owner can continue using the application offline.

### Sync behavior

Sync must be designed deliberately.

Do not assume that "write to Firebase" is equivalent to offline synchronization.

Track synchronization state where needed.

Possible states:

```txt
synced
pending
syncing
failed
```

Do not silently discard failed synchronization.

---

# Firebase Rules

Firebase is part of V1.

Use Firebase for:

- Authentication
- Cloud Firestore
- Cloud synchronization
- Cloud data recovery
- Push notifications
- Storage when required

Do not place privileged Firebase credentials or server secrets in the mobile client.

Firebase client configuration values that are intended to be public client configuration may exist in the app, but security must come from Firebase Authentication and Firestore/Storage security rules, not secrecy of client configuration.

---

# Authentication

Use Firebase Authentication.

Do not build custom password authentication.

V1 is intended for a single owner account, but the data model and security rules should associate cloud records with the authenticated owner/account where appropriate.

Protect authenticated routes.

Unauthenticated users should not access rental data.

---

# Firestore Data Rules

The exact Firestore collection structure may evolve as implementation details are validated, but the conceptual data model must remain:

```txt
properties
units
tenants
contracts
rentPeriods
payments
```

Records should include ownership/property relationships necessary for secure querying and authorization.

Do not create deeply nested Firestore structures merely because subcollections are available.

Choose structures that make synchronization, querying, security rules, and history preservation straightforward.

---

# Backup & Restore

The application requires both local and cloud recovery concepts.

## Local backup

The owner should be able to create a backup containing important application data.

The backup should preserve:

- Units
- Tenants
- Contracts
- Rent periods
- Payments
- Relevant settings

## Restore

Restoration must not silently overwrite current data.

Before implementing destructive restore behavior, define and confirm the expected conflict behavior.

## Cloud recovery

Firebase synchronization provides the cloud copy.

The UI should communicate synchronization state clearly.

Example:

```txt
✓ Synced
↻ Syncing
⚠ Pending changes
```

---

# Notifications

Notifications should be useful and non-intrusive.

V1 notification candidates:

- Rent due today
- Rent overdue
- Contract approaching expiry

Do not build notification behavior that repeatedly nags the user without a clear business reason.

Notification scheduling must account for:

- Device permissions
- Offline state
- Duplicate notifications
- Contract status
- Already-paid rent

---

# SMS

V1 SMS functionality should use the Android SMS composer where practical.

The owner can review the message before sending it.

Example:

```txt
Hi Raj, this is a reminder that your monthly rent
of LKR 8,000 is due today. Thank you.
```

Do not implement automated third-party SMS delivery without explicit scope approval.

If an external SMS provider is later added, all credentials/tokens must remain server-side.

---

# UI Implementation Rules

The goal is to replicate approved designs accurately.

When a design image is provided:

- Match layout.
- Match spacing.
- Match padding.
- Match typography hierarchy.
- Match colors.
- Match border radius.
- Match shadows.
- Match alignment.
- Match proportions.
- Include all visible elements.

Do not approximate or simplify an approved design unless explicitly asked.

For a new screen without an approved design, follow the established Neon Rent Manager design system rather than inventing a completely different visual language.

---

# Styling Rules

Use NativeWind classes as the default styling mechanism.

Before writing NativeWind-specific code:

1. Check the installed NativeWind version in `package.json`.
2. Use syntax supported by that exact version.
3. Do not upgrade NativeWind without approval.
4. Follow existing project conventions.

Prefer reusable class patterns.

Use `global.css` utilities when a pattern is genuinely reused.

Avoid large inline styles unless required.

---

# Style Exceptions

Use `StyleSheet` or inline styles when NativeWind cannot correctly represent the required native behavior.

Typical exceptions include:

- SafeAreaView native-specific configuration
- KeyboardAvoidingView behavior
- Modal native props
- Animated values
- Runtime-calculated styles
- Platform-specific styles
- Pressed-state style callbacks when needed
- Native shadow differences
- Complex transforms
- Other React Native-specific values not supported cleanly by NativeWind

Do not force Tailwind classes where native behavior requires a native style object.

---

# Image Rules

Use centralized image imports.

Before using an image:

1. Check whether `constants/images.ts` exists.
2. Create it if needed.
3. Import app images there.
4. Export them through the centralized object.
5. Use the centralized object in screens/components.

Example:

```ts
import logo from "@/assets/images/logo.png";

export const images = {
  logo,
};
```

Then:

```tsx
<Image source={images.logo} />
```

Do not import image assets directly throughout the application unless there is a strong reason.

---

# Assets

Keep assets organized:

```txt
assets/
  images/
    logo.png
    logo-dark.png
    logo-light.png
    app-icon.png
```

If additional illustrations are required, use descriptive names.

Do not add decorative assets merely because they are possible.

---

# State Management Rules

Use Zustand for global client state.

Use local React state for temporary UI state.

Use SQLite for persistent domain/application data.

Use Firebase for cloud persistence and synchronization.

Do not duplicate the same authoritative data across multiple state systems without a clear reason.

When possible, treat repositories as the boundary between UI/state and persistence.

---

# TypeScript Rules

Use strict TypeScript.

Rules:

- No `any`.
- Prefer explicit domain types.
- Keep types simple and readable.
- Avoid unnecessary generic abstractions.
- Do not use type assertions to hide errors.
- Fix the underlying type problem where practical.
- Reuse shared domain types rather than duplicating similar interfaces.

---

# Forms & Validation

Use React Hook Form for non-trivial forms.

Use Zod for validation where appropriate.

Important rental form validations include:

- Tenant name required
- Rent amount must be valid
- Due day must be valid
- Contract start/end dates must be valid
- End date must not precede start date
- Payment amount must be positive
- Payment amount must not exceed the allowed amount unless overpayment is explicitly supported
- Required unit/tenant relationships must exist

Validation should be understandable to the user.

---

# Business Rules

## Unit occupancy

A unit is occupied when it has an applicable active rental contract.

Do not manually update occupancy in a way that can contradict contract data unless there is a clearly defined exception.

## Tenant replacement

When a tenant leaves:

1. Close/expire/terminate the existing contract appropriately.
2. Preserve its history.
3. Create a new contract for the new tenant.
4. Update current occupancy state.

## Contract renewal

Renewal should preserve the previous contract.

A renewed agreement should be represented as a new contract or clearly versioned agreement rather than silently rewriting historical terms.

## Rent changes

If rent changes for a new agreement period, preserve the previous rent under the previous contract.

## Payments

Payments belong to the historical rental obligation under which they were made.

Never reassign old payments to a new tenant merely because the unit changed occupants.

---

# Dashboard Rules

The dashboard should prioritize information the owner needs daily.

V1 dashboard information:

- Current month
- Expected rent
- Collected rent
- Outstanding amount
- Paid count
- Due count
- Overdue count
- Due today
- Recent payments

Avoid turning the dashboard into a full accounting/reporting system in V1.

---

# Navigation Rules

Use Expo Router.

Keep navigation predictable.

Core navigation:

```txt
Login
  ↓
Dashboard

Main areas:
- Dashboard
- Units
- Rent
- History

Secondary:
- Tenant details
- Contract details
- Payment details
- Settings
- Backup/restore
```

Do not add navigation routes unless they represent a real user flow.

---

# Error Handling

Errors must be visible and actionable.

Avoid silent failures.

For user-facing errors:

- Explain what failed.
- Preserve unsaved data where possible.
- Provide a retry action where appropriate.
- Do not expose internal stack traces or sensitive information.

For synchronization failures:

- Keep the local data.
- Mark the sync as failed/pending.
- Allow retry.
- Do not tell the user that data is synced when it is not.

---

# Loading, Empty & Offline States

Every data-driven screen should consider:

- Loading state
- Empty state
- Error state
- Offline state
- Syncing state

Example:

```txt
No shops yet

Add your first shop to start tracking rent.

[ Add Shop ]
```

Avoid blank screens.

---

# Accessibility & Usability

The owner may use the application quickly and repeatedly.

Prioritize:

- Large touch targets
- Clear labels
- Strong visual hierarchy
- Readable text
- Clear status indicators
- Confirmation before destructive actions
- Minimal typing where possible

Do not rely on color alone to communicate payment status.

---

# Security

Never expose secrets in the client.

Never commit:

- Private API keys
- Service-account credentials
- Firebase Admin credentials
- SMS provider secrets
- Server tokens

Use server-side/backend mechanisms for privileged operations.

Use Firebase security rules to protect user data.

Do not trust client-side authorization alone.

---

# Performance

Prefer simple, efficient implementations.

Avoid:

- Unnecessary re-renders
- Repeated database reads
- Loading the entire history when only a small list is required
- Large components with unrelated responsibilities
- Premature optimization

Optimize based on a real problem.

---

# Dependency Rules

Keep dependencies intentionally small.

Before adding a library:

1. Check whether Expo/React Native/Firebase already provides the capability.
2. Check whether the current project already has a suitable solution.
3. Explain why the new dependency is needed.
4. Ask for approval before installing a new major library.

Do not introduce multiple libraries that solve the same problem.

---

# External Documentation Rules

When integrating an external library or service:

1. Read the current documentation relevant to the installed version.
2. Inspect existing project code first.
3. Follow the documented integration pattern.
4. Do not invent APIs.
5. Keep existing UI and navigation intact.
6. Do not expose secrets.
7. Test the integration independently before expanding it.

---

# Feature Implementation Rules

When implementing a feature:

1. Read this file.
2. Understand the existing implementation.
3. Identify exact files to change.
4. Make focused changes.
5. Follow existing patterns.
6. Do not refactor unrelated code.
7. Do not add unrequested features.
8. Make the feature work end-to-end.
9. Run lint.
10. Run typecheck.
11. Test the feature on a real device when appropriate.
12. Test important existing flows.
13. Explain what changed and how to test it.

---

# Bug Fix Rules

For a bug:

```txt
The [thing] currently does [actual behavior].
It should do [correct behavior].

Do not change any other behavior or layout.
```

Investigate the existing implementation before changing it.

Prefer the smallest targeted fix.

Do not rewrite an entire screen to fix one bug.

---

# Constraints Library

Use whichever constraints apply:

- "Read AGENTS.md first and follow it strictly."
- "Implement only this feature."
- "Do not change the existing screen design."
- "Preserve the existing UI exactly."
- "Keep the existing navigation flow intact."
- "Do not modify unrelated features."
- "Do not introduce new libraries."
- "If a new library is required, ask first."
- "Do not expose secrets in the client."
- "Do not rewrite working code."
- "Do not add features that were not requested."
- "Keep historical rental data intact."
- "Do not delete historical payments."
- "Preserve offline behavior."
- "Do not change the database schema outside the requested migration."
- "Run typecheck and lint before finishing."

---

# Git & Commit Rules

Use small commits.

Prefer one working feature per commit.

Example:

```txt
init: create expo project
feat: configure nativewind
feat: add authentication
feat: add units list
feat: add shop creation
feat: add tenant management
feat: add contracts
feat: add rent periods
feat: add payment collection
feat: add firestore sync
fix: prevent duplicate rent periods
```

Do not mix unrelated refactors into feature commits.

---

# Testing Strategy

The application must be tested on a real Android device before release.

At minimum test:

## Core flow

```txt
Login
→ Dashboard
→ Add unit
→ Add tenant
→ Create contract
→ Generate rent
→ Record payment
→ View history
```

## Rental history

Verify:

```txt
Tenant A
2025–2026
```

can be replaced by:

```txt
Tenant B
2027–2028
```

without losing Tenant A's contract or payments.

## Partial payment

Verify:

```txt
Due: 15,000
Paid: 10,000
Remaining: 5,000
Status: Partial
```

## Offline

Test:

- Turn internet off.
- Open the app.
- View existing data.
- Record a payment.
- Close/reopen the app.
- Confirm the payment remains.
- Restore internet.
- Confirm synchronization.

## Sync failure

Test that failed cloud synchronization:

- Does not delete local data.
- Is visible as pending/failed.
- Can retry.

## Notifications

Test:

- Permission denied
- Permission granted
- Already-paid rent
- Overdue rent
- Contract nearing expiry

## Forms

Test:

- Empty input
- Invalid amounts
- Invalid dates
- Long names
- Long notes
- Duplicate/invalid values

## Production build

Always test the actual production Android binary, not only development mode.

---

# Lint & Typecheck

Run:

```bash
npm run lint
npm run typecheck
```

Fix errors before considering a feature complete.

Do not accept `any` merely to silence TypeScript.

---

# Release Checklist

Before Google Play release:

- [ ] Core rental flow tested
- [ ] Real Android device tested
- [ ] Offline behavior tested
- [ ] Slow internet tested
- [ ] Sync tested
- [ ] Backup/restore tested
- [ ] Notifications tested
- [ ] SMS flow tested
- [ ] Empty states tested
- [ ] Error states tested
- [ ] Permission denial tested
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] No development/test buttons
- [ ] No mock production data
- [ ] No unnecessary console logs
- [ ] No secrets in source control
- [ ] Firebase security rules reviewed
- [ ] Production EAS build created
- [ ] Production build tested on a real device
- [ ] Google Play internal testing completed

---

# V1 Scope Boundaries

Do not implement the following unless explicitly added to the approved scope:

- Online rent payment gateway
- Automated third-party SMS delivery
- Full accounting system
- GST/tax accounting
- Utility billing
- Expense management
- Multi-property enterprise management
- Staff roles and permissions
- Web administration panel
- Advanced analytics
- Complex tenant portal
- AI features

The V1 priority is:

**Units → Tenants → Contracts → Rent → Payments → History → Sync → Backup**

---

# Future Features

Possible future features include:

- Automated SMS
- WhatsApp reminders
- Digital rent receipts
- PDF reports
- Expense management
- Utility billing
- Multiple properties
- Staff accounts
- Web dashboard
- Tenant document storage
- Lease document uploads
- Advanced reporting

Do not implement future features early just because the architecture could support them.

---

# Definition of Done

A feature is done when:

- The requested behavior works.
- The UI matches the approved design.
- The implementation follows this file.
- TypeScript passes.
- Lint passes.
- Existing important flows still work.
- Offline behavior is preserved where applicable.
- No unrelated files were unnecessarily changed.
- The feature can be explained clearly.
- The working change can be committed independently.

---

# Final Mental Model

Neon Rent Manager should be built using this sequence:

```txt
IDEA
  ↓
DESIGN
  ↓
GENERATE ASSETS
  ↓
LOCK STACK
  ↓
PROJECT SETUP
  ↓
AGENTS.md
  ↓
ONE FEATURE
  ↓
PROMPT
  ↓
IMPLEMENT
  ↓
READ DIFF
  ↓
RUN
  ↓
VERIFY NEW FEATURE
  ↓
VERIFY OLD FEATURES
  ↓
COMMIT
  ↓
NEXT FEATURE
```

Do not skip verification.

Do not build the entire application in one prompt.

Do not repeatedly restate project-wide rules that already belong in this file.

Do not rewrite working code without a clear reason.

When something breaks, make one targeted fix.

**AGENTS.md is the source of truth.**

Before every feature implementation:

- Read this file.
- Follow it strictly.
- Build clean, simple, maintainable code.
- Preserve historical rental data.
- Preserve offline functionality.
- Replicate approved UI designs accurately.
- Verify before moving to the next feature.
