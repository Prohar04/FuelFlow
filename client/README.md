# FuelFlow Client - Gas Station Management System

React frontend for the FuelFlow Gas Station Management System with role-based access control.

## Tech Stack

- **React 18** with Vite
- **React Router** for navigation
- **Context API** for state management
- **Axios** for API calls
- **TailwindCSS** for styling (recommended)

## Backend API Integration

The backend server is running at `http://localhost:5000` with 65+ REST API endpoints.

### Authentication

All protected routes require JWT authentication:

```javascript
Authorization: Bearer <accessToken>
```

### API Base URL

Configure in `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Features to Implement

### ✅ Backend Complete - Frontend TODO

#### 1. Authentication & Authorization

- [ ] **Login Page** (`/login`)
  - Email/password form
  - JWT token storage (localStorage)
  - Auto-redirect based on role
- [ ] **Forgot Password** (`/forgot-password`)
  - Email submission
  - Success message
- [ ] **Reset Password** (`/reset-password/:token`)
  - Token validation
  - New password form
- [ ] **Protected Routes** - Role-based routing
  - Admin → `/admin/*`
  - Manager → `/manager/*`
  - Cashier → `/pos/*`
  - Employee → `/me/*`

#### 2. Admin Dashboard

- [ ] **Pump Management** (`/admin/pumps`)
  - Create new pump (name, address, location)
  - View all pumps with stats
  - Edit pump details
- [ ] **Employee Management** (`/admin/employees`)
  - Create employee (sends onboarding email)
  - View all employees across pumps
  - Edit/terminate employees
  - View employment history
- [ ] **Price Management** (`/admin/prices`)
  - Set fuel prices by type
  - View price history
  - Effective date management
- [ ] **Analytics Dashboard** (`/admin/analytics`)
  - Sales across all pumps
  - Revenue metrics
  - Inventory summary
  - Employee statistics

#### 3. Manager Dashboard

- [ ] **Employee Management** (`/manager/employees`)
  - Create employees for assigned pump
  - View pump employees
  - Terminate employees
- [ ] **Attendance** (`/manager/attendance`)
  - Mark attendance (present/absent/late/leave)
  - View attendance records with filters
  - Bulk attendance entry
- [ ] **Shift Scheduling** (`/manager/shifts`)
  - Create shift schedules
  - Assign employees to shifts
  - View/edit shift calendar
- [ ] **Payroll** (`/manager/payroll`)
  - Generate payroll for period
  - Enter employee salaries/deductions
  - View payroll history
  - Download payslips
- [ ] **Inventory Management** (`/manager/inventory`)
  - View current stock by fuel type
  - Low-stock alerts (highlighted)
  - Stock-in entry (refills)
  - Manual adjustments
  - View ledger history
  - Set low-stock thresholds
- [ ] **Supplier Management** (`/manager/suppliers`)
  - Add/edit/delete suppliers
  - Supplier contact info
  - Fuel types supplied
- [ ] **Refill Orders** (`/manager/orders`)
  - Create order (auto-sends email + generates invoice)
  - Schedule delivery date/time slot
  - Update order status (created/emailed/pending/delivered/cancelled)
  - View order history
  - View/download invoices
- [ ] **Sales Reports** (`/manager/reports`)
  - View sales by cashier
  - Filter by date range
  - Export reports

#### 4. Cashier POS

- [ ] **POS Sales** (`/pos/sales`)
  - Create sale form (fuel type, quantity, unit price)
  - Auto-calculate total
  - Submit sale (auto-generates receipt)
  - Print/view receipt
- [ ] **Sales History** (`/pos/history`)
  - View own sales
  - Search by receipt number
  - Filter by date

#### 5. Employee Portal

- [ ] **Profile** (`/me/profile`)
  - View profile info
  - View employment history
  - Change password
- [ ] **Attendance** (`/me/attendance`)
  - View own attendance records
  - Filter by date range
- [ ] **Shifts** (`/me/shifts`)
  - View assigned shifts
  - Upcoming shift calendar
- [ ] **Payroll** (`/me/payroll`)
  - View payroll records
  - Download payslips
  - View attendance summary

#### 6. Shared Features

- [ ] **User Preferences** (`/settings`)
  - Language toggle (English/Bangla)
  - Theme switcher (system/dark/light)
  - Persisted on server
- [ ] **Public Landing** (`/`)
  - Display current fuel prices (public API)
  - Login CTA

## Folder Structure (Recommended)

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── ForgotPasswordForm.jsx
│   │   └── ResetPasswordForm.jsx
│   ├── admin/
│   │   ├── PumpForm.jsx
│   │   ├── PumpList.jsx
│   │   ├── EmployeeForm.jsx
│   │   ├── PriceForm.jsx
│   │   └── AnalyticsDashboard.jsx
│   ├── manager/
│   │   ├── AttendanceTable.jsx
│   │   ├── ShiftCalendar.jsx
│   │   ├── PayrollForm.jsx
│   │   ├── InventoryDashboard.jsx
│   │   ├── SupplierForm.jsx
│   │   └── OrderForm.jsx
│   ├── cashier/
│   │   ├── POSForm.jsx
│   │   ├── Receipt.jsx
│   │   └── SalesHistory.jsx
│   ├── employee/
│   │   ├── AttendanceView.jsx
│   │   ├── ShiftView.jsx
│   │   └── PayslipView.jsx
│   ├── shared/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RoleBasedRoute.jsx
│   │   ├── ThemeToggle.jsx
│   │   └── LanguageToggle.jsx
│   └── ui/
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Table.jsx
│       ├── Modal.jsx
│       └── Alert.jsx
├── pages/
│   ├── public/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   └── ResetPasswordPage.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── PumpsPage.jsx
│   │   ├── EmployeesPage.jsx
│   │   ├── PricesPage.jsx
│   │   └── AnalyticsPage.jsx
│   ├── manager/
│   │   ├── ManagerDashboard.jsx
│   │   ├── EmployeesPage.jsx
│   │   ├── AttendancePage.jsx
│   │   ├── ShiftsPage.jsx
│   │   ├── PayrollPage.jsx
│   │   ├── InventoryPage.jsx
│   │   ├── SuppliersPage.jsx
│   │   └── OrdersPage.jsx
│   ├── cashier/
│   │   ├── POSPage.jsx
│   │   └── SalesHistoryPage.jsx
│   └── employee/
│       ├── ProfilePage.jsx
│       ├── AttendancePage.jsx
│       ├── ShiftsPage.jsx
│       └── PayrollPage.jsx
├── context/
│   ├── AuthContext.jsx (✅ exists)
│   ├── ThemeContext.jsx
│   └── LanguageContext.jsx
├── services/
│   ├── api.js (✅ exists)
│   ├── authService.js
│   ├── pumpService.js
│   ├── userService.js
│   ├── attendanceService.js
│   ├── shiftService.js
│   ├── payrollService.js
│   ├── salesService.js
│   ├── inventoryService.js
│   ├── supplierService.js
│   ├── orderService.js
│   └── priceService.js
├── hooks/
│   ├── useAuth.js
│   ├── useTheme.js
│   └── useLanguage.js
└── utils/
    ├── animations.js (✅ exists)
    ├── formatters.js
    └── validators.js
```

## API Endpoints Reference

### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Pumps (Admin)

- `POST /api/pumps` - Create pump
- `GET /api/pumps` - List pumps (scoped)
- `PATCH /api/pumps/:id` - Update pump

### Users/Employees

- `POST /api/users` - Create employee
- `GET /api/users` - List employees (scoped)
- `GET /api/users/me` - Current user
- `PATCH /api/users/:id` - Update employee
- `POST /api/users/:id/terminate` - Terminate employee

### Attendance

- `POST /api/attendance` - Create/update attendance
- `GET /api/attendance` - List attendance (scoped)
- `GET /api/attendance/me` - Own attendance

### Shifts

- `POST /api/shifts` - Create shift
- `GET /api/shifts` - List shifts (scoped)
- `GET /api/shifts/me` - Own shifts
- `PATCH /api/shifts/:id` - Update shift

### Payroll

- `POST /api/payroll/run` - Generate payroll
- `GET /api/payroll` - List payroll (scoped)
- `GET /api/payroll/me` - Own payroll
- `GET /api/payroll/:id/payslip` - Get payslip

### Sales

- `POST /api/sales` - Create sale
- `GET /api/sales` - List sales (scoped)
- `GET /api/sales/:id` - Get sale by ID

### Inventory

- `GET /api/inventory` - Current stock levels
- `POST /api/inventory/stock-in` - Add stock
- `POST /api/inventory/adjustment` - Adjust stock
- `GET /api/inventory/ledger` - Ledger history
- `POST /api/inventory/threshold` - Set threshold

### Suppliers

- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers` - List suppliers (scoped)
- `PATCH /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Orders

- `POST /api/orders` - Create order
- `GET /api/orders` - List orders (scoped)
- `PATCH /api/orders/:id/status` - Update status
- `GET /api/orders/:id/invoice` - Get invoice

### Prices

- `GET /api/prices/current` - Current prices (public)
- `POST /api/prices` - Create price (admin)
- `GET /api/prices/history` - Price history (admin)

### Preferences

- `GET /api/preferences/me` - Get preferences
- `PATCH /api/preferences/me` - Update preferences

## Key Implementation Notes

### 1. Role-Based Rendering

```javascript
// Example: Conditional rendering based on role
{
  user.role === "admin" && <AdminPanel />;
}
{
  user.role === "manager" && <ManagerPanel />;
}
```

### 2. Pump Scoping

Managers can only access data for their assigned pump:

- Filter requests by `pumpId`
- Backend enforces scope automatically

### 3. Auto-Generated Features

- **Receipts**: Auto-generated on sale creation (format: `001/20251215/0001`)
- **Invoices**: Auto-generated on order creation (format: `INV-001/20251215/0001`)
- **Emails**: Auto-sent for employee onboarding, password reset, supplier orders

### 4. Low-Stock Alerts

- Fetched from `/api/inventory` endpoint
- Display `isLowStock` flag with warning UI
- Managers can set thresholds

### 5. Date Handling

- Use ISO 8601 format for API requests
- Display formatted dates in UI (localized)

### 6. Error Handling

Backend returns consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### 7. Success Responses

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Status

**Backend**: ✅ Complete (65+ endpoints)  
**Frontend**: 🚧 To be implemented

See [Backend Walkthrough](../server/docs/walkthrough.md) for detailed API documentation and testing guide.
