import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import config from './config/env.js';
import errorHandler from './middleware/errorHandler.js';
import { verifyEmailConnection } from './utils/email.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import pumpRoutes from './routes/pumpRoutes.js';
import userRoutes from './routes/userRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';
import shiftTemplateRoutes from './routes/shiftTemplateRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import priceRoutes from './routes/priceRoutes.js';
import preferencesRoutes from './routes/preferencesRoutes.js';
import schedulePeriodRoutes from './routes/schedulePeriodRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// Connect to MongoDB
connectDB();

// Verify email connection (non-blocking)
verifyEmailConnection();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pumps', pumpRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/shift-templates', shiftTemplateRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/schedule-periods', schedulePeriodRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Route not found',
        },
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
});

export default app;
