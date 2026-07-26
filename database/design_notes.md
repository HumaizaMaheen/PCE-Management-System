# Design Notes — Database Schema & Architecture

These notes document the architectural decisions, database normalization choices, and key workflows modeled in the `pce_management` database schema.

---

## 1. Relational Integrity & Tradeoffs

### Tradeoff: Polymorphic Relations vs. Dual Nullable Foreign Keys
For tables like `challans`, `dues_records`, and `documents` which can belong to either a public applicant (before membership is finalized) or a fully registered member, we evaluated two design options:

1. **Polymorphic Pattern** (`billable_type` VARCHAR, `billable_id` INT)
   - *Pros*: Scalable schema structure if many new billable entities are added.
   - *Cons*: Cannot define native MySQL Foreign Keys (`FOREIGN KEY`) on `billable_id` since it points to different tables depending on `billable_type`. This leaves the system vulnerable to orphaned records, limits index performance, and requires all referential integrity checks to happen in application logic.

2. **Dual Nullable Foreign Keys** (`application_id` INT, `member_id` INT)
   - *Pros*: Native foreign keys are fully maintained by the database engine. CASCADE operations work cleanly. Indexes are utilized optimally. High data integrity is guaranteed at the database tier.
   - *Cons*: Two columns exist where only one is populated at any given time, occupying slightly more space (negligible in modern relational databases) and requiring a check constraint.

**Decision**: We chose the **Dual Nullable Foreign Keys** pattern. In an enterprise financial management system where audit trails, double-entry ledger tracking, and payment reconciliations are core requirements, database-level referential integrity is non-negotiable.

**Constraints Enforced**:
To ensure that a record links to *either* an application or a member, but not both or neither, we enforce the following check constraint:
```sql
CONSTRAINT chk_billable_entity CHECK (
  (application_id IS NOT NULL AND member_id IS NULL) OR
  (application_id IS NULL AND member_id IS NOT NULL)
)
```

---

## 2. Normalization & Schema Design
The schema is normalized to **Third Normal Form (3NF)**:
- **1NF**: Atomic values, clear primary keys, no repeating groups.
- **2NF**: No partial dependencies (all non-key fields are fully dependent on the primary key).
- **3NF**: No transitive dependencies (non-key fields depend only on the primary key, not on other non-key fields).

### Decoupling Applications and Members
A key workflow rule is that approving an application does not automatically make the applicant a member. 
- **`applications`** serves as a historical repository of submissions. Once approved, the status is set to `Approved - Awaiting Payment`.
- **`members`** is a separate table. A record is only inserted into `members` once the applicant's first payment (e.g. Admission Fee + 1st Month Subscription) is manually verified by the Finance Officer.
- **Why separate them?**
  1. **Separation of Concerns**: Applicants may apply and be approved but never pay. We do not want to pollute the active member registry (or generate sequential membership IDs) with non-paying users.
  2. **Profile History**: The original application serves as an immutable point-in-time snapshot of the submission. If a member changes their address or phone number later, the `members` profile is updated, but the historical `applications` record remains intact for audits.
  3. **Decoupled Auth**: Public applicants do not have accounts. Active members and management staff do. Decoupling ensures that login credentials (`users` table) are only associated with members once they are activated.

---

## 3. Financial Workflow and Verification

### Dues, Challans, and Payments
1. **Dues Generation**: Individual dues are logged in `dues_records` (e.g. Admission Fee, Monthly Subscription, Late Fee).
2. **Challan Creation**: A challan is generated to represent a printable invoice/bill. It links to one or more `dues_records` via the `challan_id` foreign key inside `dues_records`. 
3. **Payment Receipt Upload**: The user uploads a payment receipt (image/PDF). This creates a record in `payments` linking to the `challan_id`. The status is marked as `Submitted`.
4. **Manual Verification**: A Finance Officer reviews the receipt.
   - If approved:
     - The `payment` status becomes `Approved`.
     - The `challan` status becomes `Paid`.
     - The associated `dues_records` status becomes `Paid`.
     - An entry is automatically logged in the General Ledger (`transactions`).
     - **If this is the applicant's first payment**: A trigger/application code creates the `members` record, generates their `membership_id`, creates their login credentials in `users`, links the `application`'s documents to the `member`, and sets their status to `Active`.
   - If rejected:
     - The `payment` status becomes `Rejected` with a mandatory reason.
     - The `challan` remains `Unpaid` for re-submission.

---

## 4. Anticipated Views and Stored Procedures (For Future Phases)

While we are not writing database code scripts yet, we anticipate needing the following database objects during backend development:

### Database Views
1. **`v_member_outstanding_balances`**
   - Combines all unpaid `dues_records` for each member (summing dues minus any partial payments) to represent the real-time carry-forward outstanding balance.
2. **`v_monthly_financial_summary`**
   - Aggregates income and expense `transactions` group by category and month, feeding dashboard charts.
3. **`v_active_membership_directory`**
   - Joins `members` and `users` to provide a clean read-only view of current active members with their primary contact details.

### Stored Procedures
1. **`sp_generate_monthly_dues`**
   - Run via cron/scheduler every month. Queries all active members, reads the default fee from `settings`, and inserts a new `dues_record` for each member for the current month.
2. **`sp_approve_payment_and_activate_member`**
   - Wraps the verification in a transaction: updates payment status, marks dues as paid, registers the member, generates a membership ID, creates their user account, and logs the general ledger entry. Ensures atomicity (rollback on failure).
