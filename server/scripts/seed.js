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

    // 2. Create 20 Pump Stations in Bangladesh
    console.log("\n⛽ Creating 20 petrol pump stations in Bangladesh...");
    const bangladeshLocations = [
      { name: "Dhaka Main Station", city: "Dhaka", coords: [90.4125, 23.8103] },
      { name: "Mirpur Station", city: "Dhaka", coords: [90.3504, 23.8103] },
      { name: "Gulshan Station", city: "Dhaka", coords: [90.4221, 23.8127] },
      { name: "Dhanmondi Station", city: "Dhaka", coords: [90.3667, 23.7469] },
      { name: "Motijheel Station", city: "Dhaka", coords: [90.4167, 23.7594] },
      { name: "Chittagong Port Station", city: "Chittagong", coords: [91.8318, 22.3569] },
      { name: "Chittagong Hill Station", city: "Chittagong", coords: [91.8413, 22.3431] },
      { name: "Sylhet City Station", city: "Sylhet", coords: [91.8667, 24.9083] },
      { name: "Khulna Central Station", city: "Khulna", coords: [89.5667, 22.8456] },
      { name: "Rajshahi Highway Station", city: "Rajshahi", coords: [88.5667, 24.3667] },
      { name: "Barisal Canal Station", city: "Barisal", coords: [90.3675, 22.6977] },
      { name: "Rangpur Northern Station", city: "Rangpur", coords: [89.2667, 25.7439] },
      { name: "Mymensingh Town Station", city: "Mymensingh", coords: [90.4167, 24.7471] },
      { name: "Comilla Eastern Station", city: "Comilla", coords: [91.1833, 23.4667] },
      { name: "Gazipur Industrial Station", city: "Gazipur", coords: [90.4167, 23.9945] },
      { name: "Narayanganj River Station", city: "Narayanganj", coords: [90.5, 23.6228] },
      { name: "Tangail Northern Highway", city: "Tangail", coords: [89.9167, 24.25] },
      { name: "Pabna Central Station", city: "Pabna", coords: [89.2333, 23.9167] },
      { name: "Jessore Western Border", city: "Jessore", coords: [89.1667, 23.1667] },
      { name: "Cox's Bazar Beach Station", city: "Cox's Bazar", coords: [92.0, 21.45] },
    ];

    const pumps = [];
    for (const location of bangladeshLocations) {
      const pump = await Pump.create({
        name: location.name,
        address: {
          street: `${Math.floor(Math.random() * 1000) + 1} ${location.name} Road`,
          city: location.city,
          state: location.city + " Division",
          zipCode: `${Math.floor(Math.random() * 9000) + 1000}`,
        },
        location: {
          type: "Point",
          coordinates: location.coords,
        },
        status: "active",
        createdBy: admin._id,
      });
      pumps.push(pump);
      console.log(`✅ ${location.name} (Code: ${pump.code})`);
    }

    const pump1 = pumps[0];
    const pump2 = pumps[1];

    // 3. Create Managers for Each Station
    console.log("\n👔 Creating managers for each station...");
    const managers = [];
    const managerNames = [
      "Rajesh Kumar", "Priya Sharma", "Mohammed Ali", "Fatima Khan", "Amit Singh",
      "Neha Verma", "Hassan Ahmed", "Zainab Malik", "Vikram Patel", "Anjali Roy",
      "Karim Hassan", "Divya Nair", "Ravi Gupta", "Meera Joshi", "Imran Khan",
      "Pooja Singh", "Anil Kumar", "Sneha Desai", "Arjun Reddy", "Isha Mehta"
    ];

    for (let i = 0; i < pumps.length; i++) {
      const manager = await User.create({
        name: managerNames[i],
        email: `manager${i + 1}@fuelflow.com`,
        passwordHash: "password123",
        role: "manager",
        jobTitle: "Station Manager",
        pumpId: pumps[i]._id,
        status: "active",
      });
      managers.push(manager);
      console.log(`✅ ${manager.name} - ${pumps[i].name}`);
    }

    // 4. Create 50 Employees Across Different Stations
    console.log("\n👷 Creating 50 employees across all stations...");
    const employeeRoles = ["Fuel Attendant", "Cashier", "Security Guard", "Maintenance Staff", "Cleaning Staff"];
    const employeeNames = [
      "Ahmed Hassan", "Fatima Ali", "Mohammed Rahman", "Zainab Khan", "Karim Ibrahim",
      "Aisha Malik", "Hassan Ahmed", "Leila Hassan", "Ibrahim Ali", "Noor Khan",
      "Samir Khan", "Hana Ali", "Tariq Hassan", "Amina Ahmed", "Walid Ibrahim",
      "Layla Malik", "Rashid Ahmed", "Yasmin Khan", "Saeed Hassan", "Nadia Ali",
      "Faisal Khan", "Lena Ahmed", "Omar Hassan", "Salma Malik", "Jamal Ibrahim",
      "Huda Khan", "Mustafa Ali", "Dalila Ahmed", "Hamza Hassan", "Rania Malik",
      "Aziz Khan", "Layla Hassan", "Nidal Ahmed", "Samira Khan", "Khalil Ali",
      "Soraya Malik", "Adel Hassan", "Noura Ahmed", "Malik Khan", "Rana Ali",
      "Sami Hassan", "Laila Malik", "Amin Ahmed", "Rima Khan", "Saif Ali",
      "Salma Hassan", "Nasim Malik", "Nadia Ahmed", "Rafiq Khan", "Yasir Ali"
    ];

    const allEmployees = [];
    let employeeIndex = 0;

    // Distribute employees across stations (2-3 per station)
    for (let i = 0; i < pumps.length; i++) {
      const employeesPerStation = i < 10 ? 3 : 2; // More employees at first few stations
      
      for (let j = 0; j < employeesPerStation; j++) {
        if (employeeIndex < 50) {
          const employee = await User.create({
            name: employeeNames[employeeIndex],
            email: `employee${employeeIndex + 1}@fuelflow.com`,
            passwordHash: "password123",
            role: "employee",
            jobTitle: employeeRoles[Math.floor(Math.random() * employeeRoles.length)],
            pumpId: pumps[i]._id,
            status: "active",
          });
          allEmployees.push({
            id: employee._id,
            pump: pumps[i]._id,
            name: employee.name,
            stationName: pumps[i].name,
          });
          console.log(`✅ ${employee.name} (${employee.jobTitle}) - ${pumps[i].name}`);
          employeeIndex++;
        }
      }
    }

    // 5. Create Fuel Prices
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

    // 6. Create Suppliers
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

    // 7. Create Inventory Config for all pumps
    console.log("\n📦 Setting inventory thresholds...");
    const inventoryConfigs = [];
    for (const pump of pumps) {
      inventoryConfigs.push(
        { pumpId: pump._id, fuelType: "Petrol", lowStockThreshold: 500 },
        { pumpId: pump._id, fuelType: "Diesel", lowStockThreshold: 400 },
        { pumpId: pump._id, fuelType: "Octane", lowStockThreshold: 300 }
      );
    }

    for (const config of inventoryConfigs) {
      await InventoryConfig.create(config);
    }
    console.log(`✅ Created ${inventoryConfigs.length} inventory configs`);

    // 8. Create Initial Inventory Stock for all pumps
    console.log("\n📊 Adding initial inventory...");
    const initialStock = [];
    for (const pump of pumps) {
      initialStock.push(
        {
          pumpId: pump._id,
          fuelType: "Petrol",
          quantity: 5000,
          type: "stock_in",
          refType: "manual",
          notes: "Initial stock",
        },
        {
          pumpId: pump._id,
          fuelType: "Diesel",
          quantity: 4000,
          type: "stock_in",
          refType: "manual",
          notes: "Initial stock",
        },
        {
          pumpId: pump._id,
          fuelType: "Octane",
          quantity: 3000,
          type: "stock_in",
          refType: "manual",
          notes: "Initial stock",
        }
      );
    }

    for (const stock of initialStock) {
      await InventoryLedger.create(stock);
    }
    console.log(`✅ Added initial inventory for all pumps`);

    // 9. Create Sample Sales (100+ across 6 months) - Using all stations
    console.log("\n🛒 Creating comprehensive sales data (6 months)...");
    const fuelTypes = ["Petrol", "Diesel", "Octane"];
    const salesData = [];
    let saleCount = 0;

    // Generate sales for last 6 months - realistic daily sales
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - monthOffset);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      
      // Generate 50-70 sales per month across all pumps (realistic daily fuel sales)
      const salesPerMonth = 50 + Math.floor(Math.random() * 20);
      for (let i = 0; i < salesPerMonth; i++) {
        const saleDate = new Date(monthDate);
        saleDate.setDate(1 + Math.floor(Math.random() * daysInMonth)); 
        saleDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

        const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
        const fuelPrice = fuelType === "Petrol" ? 120.5 : fuelType === "Diesel" ? 110.0 : 135.0;
        const quantity = 20 + Math.floor(Math.random() * 80); // Larger quantities for realistic data

        const randomPump = pumps[Math.floor(Math.random() * pumps.length)];
        const pumpEmployees = allEmployees.filter(emp => emp.pump.toString() === randomPump._id.toString());
        const randomEmployee = pumpEmployees[Math.floor(Math.random() * pumpEmployees.length)];
        
        const sale = await Sale.create({
          pumpId: randomPump._id,
          cashierId: randomEmployee ? randomEmployee.id : allEmployees[0].id,
          fuelType,
          quantity,
          unitPrice: fuelPrice,
          paymentMethod: "cash",
          createdAt: saleDate,
        });

        const pumpCode = randomPump.code;
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

    // 10. Create Refill Orders (50+ across 6 months) - All stations
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
        const randomPump = pumps[Math.floor(Math.random() * pumps.length)];
        const pumpManager = managers[pumps.indexOf(randomPump)];

        const order = await RefillOrder.create({
          pumpId: randomPump._id,
          managerId: pumpManager._id,
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

    // 11. Create Attendance Records (600+ across 6 months) - All 50 employees
    console.log("\n📅 Creating attendance records (6 months)...");
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

        // Find the appropriate manager for this employee's station
        const pumpIndex = pumps.findIndex(p => p._id.toString() === emp.pump.toString());
        const manager = managers[pumpIndex] || managers[0];

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
          paidBy: manager._id,
        });

        payrollCount++;
      }
    }
    console.log(`✅ Created ${payrollCount} payroll records across 6 months`);

    // 12. Create Shift Schedules (600+ across 6 months) - All employees
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

          // Find the appropriate manager for this employee's station
          const pumpIndex = pumps.findIndex(p => p._id.toString() === emp.pump.toString());
          const manager = managers[pumpIndex] || managers[0];

          const roleRequired = ['fuelBoy', 'cashier', 'security', 'general', 'maintenance'][Math.floor(Math.random() * 5)];

          await Shift.create({
            pumpId: emp.pump,
            employeeId: emp.id,
            roleRequired,
            startAt: startTime,
            endAt: endTime,
            status: 'published',
            createdBy: manager._id,
            createdAt: shiftDate,
          });

          shiftCount++;
        }
      }
    }
    console.log(`✅ Created ${shiftCount} shift schedules across 6 months`);

    // 13. Summary
    console.log("\n🎉 Database seeded successfully!\n");
    console.log("═══════════════════════════════════════");
    console.log("📊 Data Summary:");
    console.log("═══════════════════════════════════════");
    console.log(`✅ Stations: ${pumps.length}`);
    console.log(`✅ Managers: ${managers.length}`);
    console.log(`✅ Employees: ${allEmployees.length}`);
    console.log(`✅ Sales: ${saleCount} records`);
    console.log(`✅ Refill Orders: ${refillCount} records`);
    console.log(`✅ Attendance: ${attendanceCount} records`);
    console.log(`✅ Payroll: ${payrollCount} records`);
    console.log(`✅ Shifts: ${shiftCount} records`);
    console.log("═══════════════════════════════════════");
    console.log("📝 Test Credentials:");
    console.log("═══════════════════════════════════════");
    console.log("Admin:    admin@fuelflow.com / password123");
    console.log("\nManagers (Sample):");
    for (let i = 0; i < Math.min(3, managers.length); i++) {
      console.log(`  manager${i + 1}@fuelflow.com / password123 (${pumps[i].name})`);
    }
    console.log("\nEmployees (Sample):");
    for (let i = 0; i < Math.min(3, allEmployees.length); i++) {
      console.log(`  employee${i + 1}@fuelflow.com / password123 (${allEmployees[i].stationName})`);
    }
    console.log("═══════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seedData();
