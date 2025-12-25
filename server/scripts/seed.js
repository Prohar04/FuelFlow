import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import User from '../src/models/User.js';
import Pump from '../src/models/Pump.js';
import Attendance from '../src/models/Attendance.js';
import Shift from '../src/models/Shift.js';
import Payroll from '../src/models/Payroll.js';
import Sale from '../src/models/Sale.js';
import Receipt from '../src/models/Receipt.js';
import InventoryLedger from '../src/models/InventoryLedger.js';
import InventoryConfig from '../src/models/InventoryConfig.js';
import Supplier from '../src/models/Supplier.js';
import RefillOrder from '../src/models/RefillOrder.js';
import Invoice from '../src/models/Invoice.js';
import Price from '../src/models/Price.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Clear database
const clearDatabase = async () => {
  console.log('🗑️  Clearing database...');
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
  console.log('✅ Database cleared');
};

// Seed data
const seedData = async () => {
  try {
    await connectDB();
    await clearDatabase();

    console.log('🌱 Seeding database...\n');

    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@fuelflow.com',
      passwordHash: 'password123', // Will be hashed by pre-save hook
      role: 'admin',
      jobTitle: 'System Administrator',
      status: 'active',
    });
    console.log(`✅ Admin created: ${admin.email} (password: password123)`);

    // 2. Create Pumps
    console.log('\n⛽ Creating pump locations...');
    const pump1 = await Pump.create({
      name: 'Main Station',
      address: {
        street: '123 Main Street',
        city: 'Dhaka',
        state: 'Dhaka Division',
        zipCode: '1000',
      },
      location: {
        type: 'Point',
        coordinates: [90.4125, 23.8103], // Dhaka coordinates
      },
      status: 'active',
      createdBy: admin._id,
    });

    const pump2 = await Pump.create({
      name: 'Highway Station',
      address: {
        street: '456 Highway Road',
        city: 'Chittagong',
        state: 'Chittagong Division',
        zipCode: '4000',
      },
      location: {
        type: 'Point',
        coordinates: [91.8318, 22.3569], // Chittagong coordinates
      },
      status: 'active',
      createdBy: admin._id,
    });

    console.log(`✅ Created pump: ${pump1.name} (Code: ${pump1.code})`);
    console.log(`✅ Created pump: ${pump2.name} (Code: ${pump2.code})`);

    // 3. Create Managers
    console.log('\n👔 Creating managers...');
    const manager1 = await User.create({
      name: 'John Manager',
      email: 'john.manager@fuelflow.com',
      passwordHash: 'password123',
      role: 'manager',
      jobTitle: 'Station Manager',
      pumpId: pump1._id,
      status: 'active',
    });

    const manager2 = await User.create({
      name: 'Sarah Manager',
      email: 'sarah.manager@fuelflow.com',
      passwordHash: 'password123',
      role: 'manager',
      jobTitle: 'Station Manager',
      pumpId: pump2._id,
      status: 'active',
    });

    console.log(`✅ ${manager1.name} - ${pump1.name}`);
    console.log(`✅ ${manager2.name} - ${pump2.name}`);

    // 4. Create Cashiers
    console.log('\n💰 Creating cashiers...');
    const cashier1 = await User.create({
      name: 'Alice Cashier',
      email: 'alice.cashier@fuelflow.com',
      passwordHash: 'password123',
      role: 'cashier',
      jobTitle: 'Cashier',
      pumpId: pump1._id,
      status: 'active',
    });

    const cashier2 = await User.create({
      name: 'Bob Cashier',
      email: 'bob.cashier@fuelflow.com',
      passwordHash: 'password123',
      role: 'cashier',
      jobTitle: 'Cashier',
      pumpId: pump2._id,
      status: 'active',
    });

    console.log(`✅ ${cashier1.name} - ${pump1.name}`);
    console.log(`✅ ${cashier2.name} - ${pump2.name}`);

    // 5. Create Employees
    console.log('\n👷 Creating employees...');
    const employee1 = await User.create({
      name: 'David Employee',
      email: 'david.employee@fuelflow.com',
      passwordHash: 'password123',
      role: 'employee',
      jobTitle: 'Fuel Attendant',
      pumpId: pump1._id,
      status: 'active',
    });

    const employee2 = await User.create({
      name: 'Emma Employee',
      email: 'emma.employee@fuelflow.com',
      passwordHash: 'password123',
      role: 'employee',
      jobTitle: 'Security Guard',
      pumpId: pump2._id,
      status: 'active',
    });

    console.log(`✅ ${employee1.name} - ${pump1.name}`);
    console.log(`✅ ${employee2.name} - ${pump2.name}`);

    // 6. Create Fuel Prices
    console.log('\n💵 Setting fuel prices...');
    const prices = [
      { fuelType: 'Petrol', unitPrice: 120.5, source: 'manual', createdBy: admin._id },
      { fuelType: 'Diesel', unitPrice: 110.0, source: 'manual', createdBy: admin._id },
      { fuelType: 'Octane', unitPrice: 135.0, source: 'manual', createdBy: admin._id },
    ];

    for (const priceData of prices) {
      await Price.create(priceData);
      console.log(`✅ ${priceData.fuelType}: ৳${priceData.unitPrice}/L`);
    }

    // 7. Create Suppliers
    console.log('\n🚚 Creating suppliers...');
    const supplier1 = await Supplier.create({
      pumpId: pump1._id,
      name: 'Padma Oil Company',
      email: 'sales@padmaoil.com',
      phone: '+880123456789',
      fuelTypes: ['Petrol', 'Diesel', 'Octane'],
    });

    const supplier2 = await Supplier.create({
      pumpId: pump2._id,
      name: 'Meghna Petroleum',
      email: 'orders@meghnapetr.com',
      phone: '+880198765432',
      fuelTypes: ['Petrol', 'Diesel'],
    });

    console.log(`✅ ${supplier1.name} - ${pump1.name}`);
    console.log(`✅ ${supplier2.name} - ${pump2.name}`);

    // 8. Create Inventory Config
    console.log('\n📦 Setting inventory thresholds...');
    const inventoryConfigs = [
      { pumpId: pump1._id, fuelType: 'Petrol', lowStockThreshold: 500 },
      { pumpId: pump1._id, fuelType: 'Diesel', lowStockThreshold: 400 },
      { pumpId: pump1._id, fuelType: 'Octane', lowStockThreshold: 300 },
      { pumpId: pump2._id, fuelType: 'Petrol', lowStockThreshold: 600 },
      { pumpId: pump2._id, fuelType: 'Diesel', lowStockThreshold: 500 },
    ];

    for (const config of inventoryConfigs) {
      await InventoryConfig.create(config);
    }
    console.log(`✅ Created ${inventoryConfigs.length} inventory configs`);

    // 9. Create Initial Inventory Stock
    console.log('\n📊 Adding initial inventory...');
    const initialStock = [
      { pumpId: pump1._id, fuelType: 'Petrol', quantity: 5000, type: 'stock_in', refType: 'manual', notes: 'Initial stock' },
      { pumpId: pump1._id, fuelType: 'Diesel', quantity: 4000, type: 'stock_in', refType: 'manual', notes: 'Initial stock' },
      { pumpId: pump1._id, fuelType: 'Octane', quantity: 3000, type: 'stock_in', refType: 'manual', notes: 'Initial stock' },
      { pumpId: pump2._id, fuelType: 'Petrol', quantity: 6000, type: 'stock_in', refType: 'manual', notes: 'Initial stock' },
      { pumpId: pump2._id, fuelType: 'Diesel', quantity: 5000, type: 'stock_in', refType: 'manual', notes: 'Initial stock' },
    ];

    for (const stock of initialStock) {
      await InventoryLedger.create(stock);
    }
    console.log(`✅ Added initial inventory for all pumps`);

    // 10. Create Sample Sales
    console.log('\n🛒 Creating sample sales...');
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    for (let i = 0; i < 5; i++) {
      const sale = await Sale.create({
        pumpId: pump1._id,
        cashierId: cashier1._id,
        fuelType: i % 2 === 0 ? 'Petrol' : 'Diesel',
        quantity: 10 + i * 5,
        unitPrice: i % 2 === 0 ? 120.5 : 110.0,
      });

      const receiptNo = `${pump1.code}/${today}/${String(i + 1).padStart(4, '0')}`;
      const receipt = await Receipt.create({
        saleId: sale._id,
        receiptNo,
      });

      sale.receiptId = receipt._id;
      await sale.save();

      // Update inventory
      await InventoryLedger.create({
        pumpId: pump1._id,
        fuelType: sale.fuelType,
        type: 'stock_out',
        quantity: -sale.quantity,
        refType: 'sale',
        refId: sale._id,
      });
    }
    console.log(`✅ Created 5 sample sales for ${pump1.name}`);

    // 11. Create Attendance Records
    console.log('\n📅 Creating attendance records...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await Attendance.create([
      { userId: cashier1._id, pumpId: pump1._id, date: yesterday, status: 'present' },
      { userId: employee1._id, pumpId: pump1._id, date: yesterday, status: 'present' },
      { userId: cashier2._id, pumpId: pump2._id, date: yesterday, status: 'present' },
      { userId: employee2._id, pumpId: pump2._id, date: yesterday, status: 'late' },
    ]);
    console.log('✅ Created attendance records');

    // 12. Create Shifts
    console.log('\n🕐 Creating shift schedules...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Shift.create([
      {
        pumpId: pump1._id,
        date: tomorrow,
        shiftName: 'Morning Shift',
        startTime: '09:00',
        endTime: '17:00',
        assignedUserIds: [cashier1._id, employee1._id],
      },
      {
        pumpId: pump2._id,
        date: tomorrow,
        shiftName: 'Morning Shift',
        startTime: '09:00',
        endTime: '17:00',
        assignedUserIds: [cashier2._id, employee2._id],
      },
    ]);
    console.log('✅ Created shift schedules');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📝 Test Credentials:');
    console.log('═══════════════════════════════════════');
    console.log('Admin:    admin@fuelflow.com / password123');
    console.log(`Manager:  john.manager@fuelflow.com / password123 (${pump1.name})`);
    console.log(`Manager:  sarah.manager@fuelflow.com / password123 (${pump2.name})`);
    console.log(`Cashier:  alice.cashier@fuelflow.com / password123 (${pump1.name})`);
    console.log(`Employee: david.employee@fuelflow.com / password123 (${pump1.name})`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();
