/**
 * EXPRESS SERVER WITH UNIFIED API ENDPOINTS
 * 
 * This server implements the fixed /public/new-arrivals and /vendor/products endpoints
 * with consistent data formatting according to BACKEND_DESIGN_POSITIONING_GUIDE.md
 */

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`🚀 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-unified',
    features: [
      'unified_design_positioning',
      'percentage_delimitations',
      'consistent_coordinate_system'
    ],
    architecture: 'fixed_design_positioning'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🌟 ========================================');
  console.log('🌟 PRINTALMA BACKEND - UNIFIED VERSION');
  console.log('🌟 ========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('📍 Fixed endpoints:');
  console.log('   ✅ GET /public/new-arrivals (unified format)');
  console.log('   ✅ GET /vendor/products (unified format)');
  console.log('   ✅ POST /vendor/design-position (unified calculation)');
  console.log('   🏥 GET /api/health/consistency (validation)');
  console.log('');
  console.log('🔧 Architecture fixes:');
  console.log('   ✅ Unified design position calculation');
  console.log('   ✅ Consistent delimitation percentage format');
  console.log('   ✅ Same coordinate system for both APIs');
  console.log('   ✅ designPositions array format (not object)');
  console.log('   ✅ coordinateType: PERCENTAGE always');
  console.log('');
  console.log('🌟 Problem SOLVED: Design positioning now consistent!');
  console.log('🌟 ========================================');
});

module.exports = app;