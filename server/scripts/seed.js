import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

// Import models
import User from "../src/models/User.js";
import Pump from "../src/models/Pump.js";
import Attendance from "../src/models/Attendance.js";
import Shift from "../src/models/Shift.js";
import Payroll from "../src/models/Payroll.js";
import Sale from "../src/models/Sale.js";
import Receipt from "../src/models/Receipt.js";
import InventoryLedger from "../src/models/InventoryLedger.js";
import InventoryConfig from "../src/models/InventoryConfig.js";
import Supplier from "../src/models/Supplier.js";
import RefillOrder from "../src/models/RefillOrder.js";
import Invoice from "../src/models/Invoice.js";
import Price from "../src/models/Price.js";

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Clear database
const clearDatabase = async () => {
  console.log("🗑️  Clearing database...");
  await User.deleteMany({});
  await Pump.deleteMany({});
  await Attendance.deleteMany({});
  await Shift.deleteMany({});
  await Payroll.deleteMany({});
  await Sale.deleteMany({});
  await Receipt.deleteMany({});
  await InventoryLedger.deleteMany({});
  await InventoryConfig.deleteMany({});
  await Supplier.deleteMany({});
  await RefillOrder.deleteMany({});
  await Invoice.deleteMany({});
  await Price.deleteMany({});
  console.log("✅ Database cleared");
};

// Seed data
const seedData = async () => {
  try {
    await connectDB();
    await clearDatabase();

    console.log("🌱 Seeding database...\n");

    // 1. Create Admin User
    console.log("👤 Creating admin user...");
    const admin = await User.create({
      name: "Admin User",
      email: "admin@fuelflow.com",
      passwordHash: "password123", // Will be hashed by pre-save hook
      role: "admin",
      jobTitle: "System Administrator",
      status: "active",
    });
    console.log(`✅ Admin created: ${admin.email} (password: password123)`);

    // 2. Create Pumps
    console.log("\n⛽ Creating pump locations...");
    const pump1 = await Pump.create({
      name: "Main Station",
      address: {
        street: "123 Main Street",
        city: "Dhaka",
        state: "Dhaka Division",
        zipCode: "1000",
      },
      location: {
        type: "Point",
        coordinates: [90.4125, 23.8103], // Dhaka coordinates
      },
      status: "active",
      createdBy: admin._id,
    });

    const pump2 = await Pump.create({
      name: "Highway Station",
      address: {
        street: "456 Highway Road",
        city: "Chittagong",
        state: "Chittagong Division",
        zipCode: "4000",
      },
      location: {
        type: "Point",
        coordinates: [91.8318, 22.3569], // Chittagong coordinates
      },
      status: "active",
      createdBy: admin._id,
    });

    console.log(`✅ Created pump: ${pump1.name} (Code: ${pump1.code})`);
    console.log(`✅ Created pump: ${pump2.name} (Code: ${pump2.code})`);

    // 3. Create Managers
    console.log("\n👔 Creating managers...");
    const manager1 = await User.create({
      name: "John Manager",
      email: "john.manager@fuelflow.com",
      passwordHash: "password123",
      role: "manager",
      jobTitle: "Station Manager",
      pumpId: pump1._id,
      status: "active",
    });

    const manager2 = await User.create({
      name: "Sarah Manager",
      email: "sarah.manager@fuelflow.com",
      passwordHash: "password123",
      role: "manager",
      jobTitle: "Station Manager",
      pumpId: pump2._id,
      status: "active",
    });

    console.log(`✅ ${manager1.name} - ${pump1.name}`);
    console.log(`✅ ${manager2.name} - ${pump2.name}`);

    // 4. Create Cashiers
    console.log("\n💰 Creating cashiers...");
    const cashier1 = await User.create({
      name: "Alice Cashier",
      email: "alice.cashier@fuelflow.com",
      passwordHash: "password123",
      role: "cashier",
      jobTitle: "Cashier",
      pumpId: pump1._id,
      status: "active",
    });

    const cashier2 = await User.create({
      name: "Bob Cashier",
      email: "bob.cashier@fuelflow.com",
      passwordHash: "password123",
      role: "cashier",
      jobTitle: "Cashier",
      pumpId: pump2._id,
      status: "active",
    });

    const cashier3 = await User.create({
      name: "Cashier One",
      email: "cashier1@fuelflow.com",
      passwordHash: "password123",
      role: "cashier",
      jobTitle: "Cashier",
      pumpId: pump1._id,
      status: "active",
    });

    console.log(`✅ ${cashier1.name} - ${pump1.name}`);
    console.log(`✅ ${cashier2.name} - ${pump2.name}`);
    console.log(`✅ ${cashier3.name} - ${pump1.name}`);

    // 5. Create Employees
    console.log("\n👷 Creating employees...");
    const employee1 = await User.create({
      name: "David Employee",
      email: "david.employee@fuelflow.com",
      passwordHash: "password123",
      role: "employee",
      jobTitle: "Fuel Attendant",
      pumpId: pump1._id,
      status: "active",
    });

    const employee2 = await User.create({
      name: "Emma Employee",
      email: "emma.employee@fuelflow.com",
      passwordHash: "password123",
      role: "employee",
      jobTitle: "Security Guard",
      pumpId: pump2._id,
      status: "active",
    });

    console.log(`✅ ${employee1.name} - ${pump1.name}`);
    console.log(`✅ ${employee2.name} - ${pump2.name}`);

    // 6. Create Fuel Prices
    console.log("\n💵 Setting fuel prices...");
    const prices = [
      {
        fuelType: "Petrol",
        unitPrice: 120.5,
        source: "manual",
        createdBy: admin._id,
      },
      {
        fuelType: "Diesel",
        unitPrice: 110.0,
        source: "manual",
        createdBy: admin._id,
      },
      {
        fuelType: "Octane",
        unitPrice: 135.0,
        source: "manual",
        createdBy: admin._id,
      },
    ];

    for (const priceData of prices) {
      await Price.create(priceData);
      console.log(`✅ ${priceData.fuelType}: ৳${priceData.unitPrice}/L`);
    }

    // 7. Create Suppliers
    console.log("\n🚚 Creating suppliers...");
    const supplier1 = await Supplier.create({
      companyName: "Padma Oil Company",
      contactPerson: "Rafiq Ahmed",
      email: "sales@padmaoil.com",
      phone: "+880123456789",
      fuelTypes: ["Petrol", "Diesel", "Octane"],
      address: {
        line1: "123 Industrial Area",
        city: "Dhaka",
        state: "Dhaka Division",
        postalCode: "1000",
        country: "Bangladesh",
      },
      createdBy: admin._id,
    });

    const supplier2 = await Supplier.create({
      companyName: "Meghna Petroleum",
      contactPerson: "Kamal Hossain",
      email: "orders@meghnapetr.com",
      phone: "+880198765432",
      fuelTypes: ["Petrol", "Diesel"],
      address: {
        line1: "456 Port Road",
        city: "Chittagong",
        state: "Chittagong Division",
        postalCode: "4000",
        country: "Bangladesh",
      },
      createdBy: admin._id,
    });

    console.log(`✅ ${supplier1.companyName}`);
    console.log(`✅ ${supplier2.companyName}`);

    // 8. Create Inventory Config
    console.log("\n📦 Setting inventory thresholds...");
    const inventoryConfigs = [
      { pumpId: pump1._id, fuelType: "Petrol", lowStockThreshold: 500 },
      { pumpId: pump1._id, fuelType: "Diesel", lowStockThreshold: 400 },
      { pumpId: pump1._id, fuelType: "Octane", lowStockThreshold: 300 },
      { pumpId: pump2._id, fuelType: "Petrol", lowStockThreshold: 600 },
      { pumpId: pump2._id, fuelType: "Diesel", lowStockThreshold: 500 },
    ];

    for (const config of inventoryConfigs) {
      await InventoryConfig.create(config);
    }
    console.log(`✅ Created ${inventoryConfigs.length} inventory configs`);

    // 9. Create Initial Inventory Stock
    console.log("\n📊 Adding initial inventory...");
    const initialStock = [
      {
        pumpId: pump1._id,
        fuelType: "Petrol",
        quantity: 5000,
        type: "stock_in",
        refType: "manual",
        notes: "Initial stock",
      },
      {
        pumpId: pump1._id,
        fuelType: "Diesel",
        quantity: 4000,
        type: "stock_in",
        refType: "manual",
        notes: "Initial stock",
      },
      {
        pumpId: pump1._id,
        fuelType: "Octane",
        quantity: 3000,
        type: "stock_in",
        refType: "manual",
        notes: "Initial stock",
      },
      {
        pumpId: pump2._id,
        fuelType: "Petrol",
        quantity: 6000,
        type: "stock_in",
        refType: "manual",
        notes: "Initial stock",
      },
      {
        pumpId: pump2._id,
        fuelType: "Diesel",
        quantity: 5000,
        type: "stock_in",
        refType: "manual",
        notes: "Initial stock",
      },
    ];

    for (const stock of initialStock) {
      await InventoryLedger.create(stock);
    }
    console.log(`✅ Added initial inventory for all pumps`);

    // 10. Create Sample Sales (100+ across 6 months)
    console.log("\n🛒 Creating comprehensive sales data (6 months)...");
    const fuelTypes = ["Petrol", "Diesel", "Octane"];
    const salesData = [];
    let saleCount = 0;

    // Generate sales for last 6 months - realistic daily sales
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - monthOffset);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      
      // Generate 50-70 sales per month (realistic daily fuel sales)
      const salesPerMonth = 50 + Math.floor(Math.random() * 20);
      for (let i = 0; i < salesPerMonth; i++) {
        const saleDate = new Date(monthDate);
        saleDate.setDate(1 + Math.floor(Math.random() * daysInMonth)); 
        saleDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

        const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
        const fuelPrice = fuelType === "Petrol" ? 120.5 : fuelType === "Diesel" ? 110.0 : 135.0;
        const quantity = 20 + Math.floor(Math.random() * 80); // Larger quantities for realistic data

        const isPump1 = Math.random() > 0.5;
        const sale = await Sale.create({
          pumpId: isPump1 ? pump1._id : pump2._id,
          cashierId: isPump1 ? (Math.random() > 0.5 ? cashier1._id : cashier3._id) : cashier2._id,
          fuelType,
          quantity,
          unitPrice: fuelPrice,
          paymentMethod: "cash",
          createdAt: saleDate,
        });

        const pumpCode = isPump1 ? pump1.code : pump2.code;
        const dateStr = saleDate.toISOString().split("T")[0].replace(/-/g, "");
        const receiptNo = `${pumpCode}/${dateStr}/${String(saleCount + 1).padStart(4, "0")}`;
        
        const receipt = await Receipt.create({
          saleId: sale._id,
          receiptNo,
          createdAt: saleDate,
        });

        sale.receiptId = receipt._id;
        await sale.save();

        // Update inventory
        await InventoryLedger.create({
          pumpId: sale.pumpId,
          fuelType,
          type: "stock_out",
          quantity,
          refType: "sale",
          refId: sale._id,
          createdAt: saleDate,
        });

        saleCount++;
      }
    }
    console.log(`✅ Created ${saleCount} sales across 6 months`);

    // 11. Create Refill Orders (50+ across 6 months)
    console.log("\n🚚 Creating refill orders (6 months)...");
    let refillCount = 0;
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - monthOffset);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      
      const refillsPerMonth = 15 + Math.floor(Math.random() * 10);
      for (let i = 0; i < refillsPerMonth; i++) {
        const refillDate = new Date(monthDate);
        refillDate.setDate(1 + Math.floor(Math.random() * daysInMonth));
        refillDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

        const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
        const quantity = 1000 + Math.floor(Math.random() * 2000);
        const supplier = Math.random() > 0.5 ? supplier1 : supplier2;
        const isPump1 = Math.random() > 0.5;

        const order = await RefillOrder.create({
          pumpId: isPump1 ? pump1._id : pump2._id,
          managerId: isPump1 ? manager1._id : manager2._id,
          supplierId: supplier._id,
          items: [{
            fuelType,
            quantity,
          }],
          scheduledDeliveryDate: refillDate,
          scheduledDeliverySlot: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)],
          status: 'delivered',
          createdAt: refillDate,
        });

        refillCount++;
      }
    }
    console.log(`✅ Created ${refillCount} refill orders across 6 months`);

    // 12. Create Attendance Records (100+ across 6 months)
    console.log("\n📅 Creating attendance records (6 months)...");
    const allEmployees = [
      { id: cashier1._id, pump: pump1._id },
      { id: cashier2._id, pump: pump2._id },
      { id: cashier3._id, pump: pump1._id },
      { id: employee1._id, pump: pump1._id },
      { id: employee2._id, pump: pump2._id },
    ];
    let attendanceCount = 0;

    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - monthOffset);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

      for (const emp of allEmployees) {
        // 20-25 days per month per employee (realistic work schedule)
        const workDays = 20 + Math.floor(Math.random() * 6);
        const attendanceDates = new Set();

        while (attendanceDates.size < workDays) {
          const day = 1 + Math.floor(Math.random() * daysInMonth);
          attendanceDates.add(day);
        }

        for (const day of attendanceDates) {
          const attDate = new Date(monthDate);
          attDate.setDate(day);

          const statuses = ["present", "present", "present", "late", "absent"];
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          await Attendance.create({
            userId: emp.id,
            pumpId: emp.pump,
            date: attDate,
            status,
            checkInTime: status === "absent" ? null : new Date(attDate.setHours(8, 30 + Math.floor(Math.random() * 30))),
            checkOutTime: status === "absent" ? null : new Date(attDate.setHours(17, Math.floor(Math.random() * 60))),
          });

          attendanceCount++;
        }
      }
    }
    console.log(`✅ Created ${attendanceCount} attendance records across 6 months`);

    // 13. Create Payroll Records (30 records across 6 months)
    console.log("\n💰 Creating payroll records (6 months)...");
    let payrollCount = 0;

    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - monthOffset);
      
      const periodStart = new Date(monthDate);
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
      
      const periodEnd = new Date(monthDate);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(0);
      periodEnd.setHours(23, 59, 59, 999);

      for (const emp of allEmployees) {
        const totalHours = 160 + Math.floor(Math.random() * 40);
        const hourlyRate = 150;
        const baseSalary = 24000; // Fixed base salary
        const grossPay = baseSalary + (totalHours - 160) * hourlyRate; // Base + overtime
        const deductions = Math.floor(grossPay * 0.1);
        const netPay = grossPay - deductions;

        await Payroll.create({
          userId: emp.id,
          pumpId: emp.pump,
          periodStart,
          periodEnd,
          hourlyRate,
          totalHoursWorked: totalHours,
          baseSalary,
          attendanceSummary: {
            totalDays: 26,
            presentDays: 24,
            absentDays: 1,
            lateDays: 1,
            leaveDays: 0,
          },
          absentDeduction: 10,
          lateDeduction: 5,
          attendanceDeductions: 15,
          grossPay,
          deductions,
          netPay,
          paymentStatus: "given",
          paidAt: periodEnd,
          paidBy: manager1._id,
        });

        payrollCount++;
      }
    }
    console.log(`✅ Created ${payrollCount} payroll records across 6 months`);

    // 14. Create Shift Schedules (100+ across 6 months)
    console.log("\n🕐 Creating shift schedules (6 months)...");
    let shiftCount = 0;
    const shiftTypes = [
      { name: "Morning", start: 9, end: 17 },
      { name: "Evening", start: 17, end: 1 }, // Next day
      { name: "Night", start: 1, end: 9 },
    ];

    for (let monthOffset = 5; monthOffset >= -1; monthOffset--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - monthOffset);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

      for (let day = 1; day <= Math.min(daysInMonth, 25); day++) {
        const shiftDate = new Date(monthDate);
        shiftDate.setDate(day);

        for (const emp of allEmployees) {
          const shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
          const startTime = new Date(shiftDate);
          startTime.setHours(shiftType.start, 0, 0, 0);

          const endTime = new Date(shiftDate);
          if (shiftType.end < shiftType.start) {
            endTime.setDate(endTime.getDate() + 1);
          }
          endTime.setHours(shiftType.end, 0, 0, 0);

          // Determine role: cashier employees are cashiers, others are fuelBoy
          const isCashier = emp.id.toString() === cashier1._id.toString() || emp.id.toString() === cashier2._id.toString() || emp.id.toString() === cashier3._id.toString();
          const role = isCashier ? 'cashier' : ['fuelBoy', 'security', 'general'][Math.floor(Math.random() * 3)];

          await Shift.create({
            pumpId: emp.pump,
            employeeId: emp.id,
            roleRequired: role,
            startAt: startTime,
            endAt: endTime,
            status: 'published',
            createdBy: manager1._id,
            createdAt: shiftDate,
          });

          shiftCount++;
        }
      }
    }
    console.log(`✅ Created ${shiftCount} shift schedules across 6 months`);

    // 15. Summary
    console.log("\n🎉 Database seeded successfully!\n");
    console.log("═══════════════════════════════════════");
    console.log("📊 Data Summary:");
    console.log("═══════════════════════════════════════");
    console.log(`✅ Sales: ${saleCount} records`);
    console.log(`✅ Refill Orders: ${refillCount} records`);
    console.log(`✅ Attendance: ${attendanceCount} records`);
    console.log(`✅ Payroll: ${payrollCount} records`);
    console.log(`✅ Shifts: ${shiftCount} records`);
    console.log("═══════════════════════════════════════");
    console.log("📝 Test Credentials:");
    console.log("═══════════════════════════════════════");
    console.log("Admin:    admin@fuelflow.com / password123");
    console.log(
      `Manager:  john.manager@fuelflow.com / password123 (${pump1.name})`
    );
    console.log(
      `Manager:  sarah.manager@fuelflow.com / password123 (${pump2.name})`
    );
    console.log(
      `Cashier:  alice.cashier@fuelflow.com / password123 (${pump1.name})`
    );
    console.log(
      `Cashier:  cashier1@fuelflow.com / password123 (${pump1.name})`
    );
    console.log(
      `Employee: david.employee@fuelflow.com / password123 (${pump1.name})`
    );
    console.log("═══════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seedData();
