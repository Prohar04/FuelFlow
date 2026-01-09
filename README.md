# Petrol Pump Management System (RBAC + Multi-Pump)

This project is a **Petrol Pump Management System** designed to manage one or multiple fuel stations from a single platform using a strict **role-based access control (RBAC)** model. It supports **Admin, Manager, Cashier, and General Employee** roles, where Admin has full access across all locations and can add new pumps, Managers control only their assigned pump, Cashiers handle sales, and Employees can access their own attendance, payroll, and employment history.

The system includes complete **employee lifecycle management** (hire/fire, role assignment, pump assignment) with **automatic onboarding emails** sent via Nodemailer containing login credentials (email/username and a temporary password), plus a secure **password reset** option. Managers can manage **attendance, shift scheduling, payroll generation, and payslip access**, while employees can view their own records anytime.

For operations, it provides a **cashier POS module** for recording sales, automatic **receipt generation**, and a searchable **sales history and e-receipt archive** accessible by Admin and Managers. It also includes **fuel inventory tracking** per pump using stock in/out logs, and shows **low-stock alerts** to managers when they log in or view inventory. Managers can manage **suppliers**, create **refill orders with scheduling (smart booking)**, automatically email suppliers with order details, generate **order invoices**, and track deliveries through an **order tracking dashboard** with status updates.

On the business side, Admin/Managers get a scoped **analytics dashboard** and **MIS reporting** (daily, weekly, monthly) with export options. The platform supports **dynamic fuel price display** on the public landing page (set by Admin or fetched through an API), and user personalization features like **Bangla/English language selection** and **system/dark/light theme settings**, both saved securely on the server for persistence across sessions.

---

## Project Architecture
- **MVC**


## Feature List

1. **Multi-Pump (Location) Management**
   - Admin can create and manage petrol pump locations.
   - Admin can access and monitor all locations.

2. **Role-Based Access Control (RBAC)**
   - Roles: **Admin, Manager, Cashier, General Employee**.
   - “General Employee” includes: **Fuel Boy, Security Guard** (role sub-type or jobTitle).

3. **Employee Management (Hire/Fire + Assign Pump)**
   - Admin can add/fire employees of any type across all pumps.
   - Manager can add/fire employees **only** within their assigned pump.

4. **Employee Onboarding Email (Nodemailer) + Temporary Password**
   - When Admin adds an employee (any type), send an email containing:
     - role + assigned pump
     - login URL
     - username/email
     - **temporary password**
   - Employee can reset/change password later.

5. **Employee Profile + Employment History**
   - Stores role, pump, join date, status, and history of changes.
   - Employees can view their own profile and employment history.

6. **Attendance Tracking + Shift Scheduling**
   - Manager records attendance and publishes shift schedule for their pump.
   - Employees can view their own attendance and shifts.

7. **Payroll Management + Payslips**
   - Manager generates payroll for their pump.
   - Employees can view payroll and download payslip.

8. **Sales Entry (Cashier POS, Cash Sales)**
   - Cashier records sales in cash (v1).
   - Stores fuel type, quantity, unit price, total, date/time, pump.

9. **Auto Receipt Generation (Per Sale)**
   - Each sale creates a unique receipt number.
   - Receipt is printable (optional PDF).

10. **Customer Purchase History + E‑Receipt Archive**

- Stores all billing records.
- Accessible to **Admin + Manager**.
- Cashier can view own submitted sales.

11. **Fuel Inventory Tracking (Per Pump)**

- Inventory ledger: stock-in, stock-out (sales), adjustments.
- Remaining stock computed from ledger.

12. **Low-Stock Alerts (Not Real-Time, In-App)**

- On manager login and inventory page load, calculate stock vs threshold.
- Show notifications to the manager of that pump.

13. **Supplier Management (Per Pump)**

- Manager maintains supplier list per pump (name, email, phone, fuelTypes).

14. **Automated Refill Order (Email-Based via Nodemailer)**

- Manager creates refill order with fuel names + quantities.
- System emails supplier with:
  - pump location details
  - order items
  - manager email (reply-to)

15. **Order Invoice Generation (Per Refill Order)**

- Creating a refill order generates an invoice (printable, optional PDF).

16. **Order Tracking Page + Statuses**

- Track status: `created`, `emailed`, `pending`, `delivered`, `cancelled`.
- Keep full order history per pump.

17. **Smart Booking for Orders (Scheduling)**

- Manager can schedule refill orders:
  - `scheduledDeliveryDate`
  - `scheduledDeliverySlot` (morning/afternoon/evening)

18. **Fuel Price Management + Public Landing Display**

- Admin sets prices manually OR system fetches from an API.
- Prices are shown for everyone on the landing page.

19. **Admin/Manager Analytics Dashboard (Scoped)**

- Admin sees all pumps.
- Manager sees only their pump.
- Metrics: sales, revenue, prices, employees, inventory, fuel consumption trends.

20. **User Preferences (Language + Theme stored on server)**

- Language: Bangla/English.
- Theme: system/dark/light.
- Stored server-side and applied after login.

---

## Roles & Permissions

### Roles

- **Admin**
  - Full control for all pumps.
  - Can add new pump.
  - Can add/fire any employee.
  - Can view all analytics.
  - Sets prices.

- **Manager**
  - Full control for the pump they are assigned to.
  - Can add/fire employees in their pump only.
  - Handles attendance and payroll for their pump.
  - Manages suppliers and orders for their pump.
  - Views analytics for their pump.

- **Cashier**
  - Creates sales (cash only).
  - Views their own payroll, attendance, and employment history.
  - Views their submitted sales.

- **General Employee (Fuel Boy, Security Guard)**
  - No sales.
  - Views own payroll, attendance, and employment history.

### Permission Matrix (summary)

| Action                                    |     Admin |                   Manager |         Cashier | General Employee |
| ----------------------------------------- | --------: | ------------------------: | --------------: | ---------------: |
| Create pump/location                      |        ✅ |                        ❌ |              ❌ |               ❌ |
| Access other pump data                    |        ✅ |                        ❌ |              ❌ |               ❌ |
| Create employees                          |        ✅ |             ✅ (own pump) |              ❌ |               ❌ |
| Fire employees                            |        ✅ |             ✅ (own pump) |              ❌ |               ❌ |
| **Send onboarding email + temp password** |        ✅ | ✅(only general employee) |              ❌ |               ❌ |
| Attendance + shift scheduling             |  ✅ (all) |             ✅ (own pump) |       👁️ (self) |        👁️ (self) |
| Payroll run                               |  ✅ (all) |             ✅ (own pump) |              ❌ |               ❌ |
| View payroll                              |        ✅ |                        ✅ |       ✅ (self) |        ✅ (self) |
| Create sale                               |        ✅ |                (optional) |              ✅ |               ❌ |
| View sales                                |  ✅ (all) |             ✅ (own pump) |        ✅ (own) |               ❌ |
| Inventory                                 |  ✅ (all) |             ✅ (own pump) | (optional view) |               ❌ |
| Suppliers + refill orders                 |  ✅ (all) |             ✅ (own pump) |              ❌ |               ❌ |
| Analytics + reports                       |  ✅ (all) |             ✅ (own pump) |              ❌ |               ❌ |
| Set prices                                |        ✅ |                        ❌ |              ❌ |               ❌ |
| Language + theme                          | ✅ (self) |                 ✅ (self) |       ✅ (self) |        ✅ (self) |

Managers are allowed to create employee accounts, reuse the same onboarding email flow.

---

## Must-Have Security Rules

1. **Never store plaintext passwords**
   - Store only `passwordHash` (bcrypt).
2. **Temporary password is generated once**
   - Sent via email only.
   - Not returned via API responses.
3. **Password reset uses token**
   - Token is random, short-lived, single-use.
   - Store only a hash of token in DB.

---

## Main Modules

### 1) Auth + RBAC

- Use JWT (access + refresh) or session-based auth.
- Middleware pattern suggestion:
  - `requireAuth`
  - `requireRole(...roles)`
  - `requirePumpScope(resourcePumpId)` for manager-scoped access

### 2) Pump (Location) Management (Admin)

- Admin can create/update pump details.
- Every non-admin user is assigned exactly one `pumpId`.

### 3) Employee Management

- Create employee with:
  - role: `admin | manager | cashier | employee`
  - jobTitle/subRole for employees: `fuel_boy | security_guard` (or free text)
  - pump assignment (required for all non-admin roles)

**On Create Employee**

- Generate temp password
- Save user with hashed password
- Send onboarding email

**On Termination**

- Set status = `terminated`
- Store termination date/reason (optional)
- Keep history for reporting

### 4) Attendance + Shifts

- Attendance statuses: `present`, `absent`, `late`, `leave`
- Shifts:
  - date
  - shiftName / start-end time
  - assigned employees

### 5) Payroll

- Payroll period (weekly/monthly) configurable.
- Payroll should store:
  - attendance summary
  - base salary
  - net pay
  - generated timestamp
- Employees can download payslip.

### 6) Sales + Receipts

- Cashier creates sale record.
- Receipt number suggestion:
  - `PUMP-CODE/YYYYMMDD/XXXX`
- On sale creation:
  - Create receipt record
  - Create inventory `stock_out` ledger entry

### 7) Inventory + Low Stock

- Inventory ledger supports:
  - `stock_in` (refill delivery)
  - `stock_out` (sales)
  - `adjustment` (admin/manager corrections)
- Remaining stock:
  - `sum(stock_in) - sum(stock_out) + sum(adjustment)`
- Low stock alerts:
  - computed on login + inventory page open (not real-time)
  - visible to manager only

### 8) Suppliers + Orders + Email + Invoices

- Supplier is per pump.
- Refill order stores:
  - items (fuel type + quantity)
  - scheduled date/slot (smart booking)
  - status tracking

**Order Email**

- Use Nodemailer SMTP transport.
- Email includes:
  - pump name and address
  - item list
  - manager contact email
  - order reference number

**Invoice**

- Generate invoice number:
  - `INV-PUMP-CODE/YYYYMMDD/XXXX`

### 9) Prices + Landing Page

- `GET /prices/current` is public.
- Admin can update prices manually.
- Optional: API sync job can update prices [later implementation].

### 10) Analytics + MIS Reports

- Dashboard for Admin/Manager:
  - total sales, total revenue
  - sales by fuel type
  - inventory usage trends
  - price history
  - attendance and payroll summaries
- Reports:
  - daily/weekly/monthly
  - export CSV/PDF

### 11) User Preferences (Language + Theme)

- Save `language` and `theme` in user profile.
- Apply on login and persist across sessions.

---

## Suggested Frontend Pages

Public

- `/` Landing (prices)

Auth

- `/login`
- `/forgot-password`
- `/reset-password/:token`

Dashboard (Protected)

- `/dashboard`

Admin

- `/admin/pumps`
- `/admin/employees`
- `/admin/prices`
- `/admin/analytics`
- `/admin/reports`

Manager

- `/manager/employees`
- `/manager/attendance`
- `/manager/shifts`
- `/manager/payroll`
- `/manager/inventory`
- `/manager/suppliers`
- `/manager/orders`
- `/manager/analytics`
- `/manager/reports`

Cashier

- `/pos/sales`
- `/pos/sales/history`

Employee

- `/me/profile`
- `/me/attendance`
- `/me/payroll`

Settings

- `/settings`

---

## Suggested Backend API Endpoints

> All protected routes require `Authorization: Bearer <token>`.

### Auth

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password` → sends reset link email
- `POST /api/auth/reset-password` → resets password using token

### Pumps (Admin)

- `POST /api/pumps`
- `GET /api/pumps`
- `PATCH /api/pumps/:id`

### Users / Employees

- `POST /api/users` (admin or manager; scope check)
- `GET /api/users` (admin all, manager own pump)
- `GET /api/users/me`
- `PATCH /api/users/:id`
- `POST /api/users/:id/terminate`

### Attendance

- `POST /api/attendance` (manager)
- `GET /api/attendance` (admin all, manager own, employee self)
- `GET /api/attendance/me`

### Shifts

- `POST /api/shifts` (manager)
- `GET /api/shifts` (scoped)
- `GET /api/shifts/me`

### Payroll

- `POST /api/payroll/run` (manager)
- `GET /api/payroll` (admin all, manager own)
- `GET /api/payroll/me`
- `GET /api/payroll/:id/payslip`

### Sales

- `POST /api/sales` (cashier)
- `GET /api/sales` (admin all, manager own, cashier own)

### Inventory

- `GET /api/inventory` (admin all, manager own)
- `POST /api/inventory/stock-in` (manager)
- `POST /api/inventory/adjustment` (admin/manager)

### Suppliers

- `POST /api/suppliers` (manager)
- `GET /api/suppliers` (scoped)
- `PATCH /api/suppliers/:id`

### Orders

- `POST /api/orders` (manager)
- `GET /api/orders` (admin all, manager own)
- `PATCH /api/orders/:id/status`
- `GET /api/orders/:id/invoice`

### Prices

- `GET /api/prices/current` (public)
- `POST /api/prices` (admin)
- `PATCH /api/prices/:id` (admin)

### Reports

- `GET /api/reports/daily`
- `GET /api/reports/weekly`
- `GET /api/reports/monthly`
- `GET /api/reports/export?type=csv|pdf`

### Preferences

- `GET /api/preferences/me`
- `PATCH /api/preferences/me`

### Notifications (Low Stock)

- `GET /api/notifications` (manager: low stock + order updates)

---

## Data Model Sketch (MongoDB)

### Pump

- `_id`
- `name`
- `code` (auto generated 3 digit number)
- `address`
- `status` (`active|terminated`)
- `location`
- `createdBy`
- `createdAt`

### User

- `_id`
- `name`
- `email` (username)
- `passwordHash`
- `role` (`admin|manager|cashier|employee`)
- `jobTitle` (for employee subtype)
- `pumpId` (null for admin)
- `status` (`active|terminated`)
- `employmentHistory[]` (role/pump changes with timestamps)
- `preferences` `{ language: 'bn'|'en', theme: 'system'|'dark'|'light' }`
- Password reset fields:
  - `resetPasswordTokenHash` (optional)
  - `resetPasswordExpiresAt` (optional)
  - `lastPasswordChangeAt` (optional)

### Attendance

- `_id`
- `userId`
- `pumpId`
- `date`
- `status`
- `checkIn`, `checkOut`
- `notes`

### Shift

- `_id`
- `pumpId`
- `date`
- `shiftName`
- `startTime`, `endTime`
- `assignedUserIds[]`

### Payroll

- `_id`
- `userId`
- `pumpId`
- `periodStart`, `periodEnd`
- `baseSalary`
- `attendanceSummary`
- `grossPay`, `deductions`, `netPay`
- `generatedAt`

### Sale

- `_id`
- `pumpId`
- `cashierId`
- `fuelType`
- `quantity`
- `unitPrice`
- `total`
- `paymentMethod` (`cash`)
- `receiptId`
- `createdAt`

### Receipt

- `_id`
- `saleId`
- `receiptNo`
- `createdAt`

### InventoryLedger

- `_id`
- `pumpId`
- `fuelType`
- `type` (`stock_in|stock_out|adjustment`)
- `quantity`
- `refType` (`sale|order|manual`)
- `refId`
- `createdAt`

### InventoryConfig

- `_id`
- `pumpId`
- `fuelType`
- `lowStockThreshold`

### Supplier

- `_id`
- `pumpId`
- `name`
- `email`
- `phone`
- `fuelTypes[]`

### RefillOrder

- `_id`
- `pumpId`
- `managerId`
- `supplierId`
- `items[]` `{ fuelType, quantity }`
- Smart booking:
  - `scheduledDeliveryDate` (optional)
  - `scheduledDeliverySlot` (optional)
- `status`
- `invoiceId`
- Email log:
  - `emailLog.sent`
  - `emailLog.sentAt`
  - `emailLog.to`
  - `emailLog.messageId`
- `createdAt`

### Invoice

- `_id`
- `refillOrderId`
- `invoiceNo`
- `createdAt`

### Price

- `_id`
- `fuelType`
- `unitPrice`
- `source` (`manual|api`)
- `effectiveFrom`
- `createdBy`
- `createdAt`

---

## Email Requirements (Nodemailer)

### A) Employee Onboarding Email (Admin creates employee)

- Trigger: successful `POST /api/users`
- Must include:
  - employee role + pump
  - login URL
  - username/email
  - temporary password
  - reset/change instructions

**Example Subject**

- `Welcome to {PumpName} – Your Account Details`

**Example Body**

- Hello {Name},
- You have been added as {Role} at {PumpName}.
- Login: {APP_BASE_URL}/login
- Username: {Email}
- Temporary Password: {TempPassword}
- You can reset/change your password anytime from the “Forgot Password” page.

### B) Supplier Refill Order Email (Manager creates order)

- Trigger: successful `POST /api/orders`
- Must include:
  - pump location
  - list of fuel items + quantities
  - manager email
  - order reference number

---

## Password Reset Flow (Required)

1. **Forgot Password**
   - User submits email.
   - If email exists, generate a token.
   - Save `resetPasswordTokenHash` + expiry time.
   - Email reset link: `{APP_BASE_URL}/reset-password/{token}`

2. **Reset Password**
   - User submits token + new password.
   - Validate token hash and expiry.
   - Update `passwordHash`, clear reset token fields.
   - Update `lastPasswordChangeAt`.

---

## Environment Variables (Example)

Create `.env`:

- `NODE_ENV=development`
- `PORT=5000`
- `MONGODB_URI=mongodb://...`
- `JWT_ACCESS_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `APP_BASE_URL=http://localhost:3000`

SMTP (Nodemailer)

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=your_email`
- `SMTP_PASS=your_app_password`
- `SMTP_FROM="Pump System <your_email>"`

Later implementation: price API

- `FUEL_PRICE_API_URL=...`
- `FUEL_PRICE_API_KEY=...`

---

## Acceptance Checklist

### RBAC + Scope

- ✅ Admin can access all pumps.
- ✅ Manager can only access their pump.
- ✅ Cashier can only create sales and view own info.
- ✅ Employee can only view own info.

### Employee Onboarding Email

- ✅ Admin creates employee → email sent with username + temp password.
- ✅ Password is stored hashed only.
- ✅ Employee can reset password later.

### Sales + Inventory

- ✅ Sale generates receipt.
- ✅ Sale creates inventory stock_out ledger entry.
- ✅ Remaining stock matches ledger math.

### Orders + Email + Invoice

- ✅ Manager creates refill order → supplier email sent.
- ✅ Invoice generated.
- ✅ Order status tracking works.

### Preferences

- ✅ Language + theme saved on server and applied after login.
