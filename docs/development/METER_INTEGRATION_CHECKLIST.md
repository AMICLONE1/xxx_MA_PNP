# Energy Meter Integration Checklist

## 🎯 Quick Summary

This checklist covers everything needed to integrate:
1. **Fake Energy Meter** (for development/testing) - **Start Here** ✅
2. **Real Energy Meter** (for production) - **After Fake Meter** ✅

---

## 📋 Phase 1: Fake Energy Meter Simulation

### ✅ Prerequisites (Already Done)
- [x] EnergyData type defined
- [x] Database schema in Supabase
- [x] Meter store (Zustand)
- [x] UI components (HomeScreen, EnergyChartScreen)
- [x] Storage services (Supabase, MMKV)

### 🔨 To Build (Priority Order)

#### 1. Meter Simulator Service ⭐ **START HERE**
**File:** `src/services/mock/meterSimulator.ts`

**What it does:**
- Generates realistic solar generation data (time-based curve)
- Generates realistic consumption data (peak hours, base load)
- Simulates weather variations
- Creates EnergyData objects

**Key Functions:**
```typescript
generateEnergyData(meterId, startDate, endDate, config): EnergyData[]
generateRealTimeData(meterId): EnergyData
simulateSolarGeneration(timestamp, config): number
simulateConsumption(timestamp, config): number
```

**Estimated Time:** 4-6 hours

#### 2. Meter Configuration
**File:** `src/utils/meterConfig.ts`

**What it does:**
- Default meter configurations
- Solar capacity settings
- Consumption patterns
- Weather simulation parameters

**Estimated Time:** 1-2 hours

#### 3. Background Data Generator
**File:** `src/services/mock/backgroundDataGenerator.ts`

**What it does:**
- Runs in background
- Generates data every 15 minutes
- Stores in Supabase and local store
- Handles app state changes

**Estimated Time:** 3-4 hours

#### 4. Integration with Meter Service
**File:** `src/services/api/meterService.ts` (update)

**What it does:**
- Check if mock mode is enabled
- Use simulator when in mock mode
- Fallback to real API when available

**Estimated Time:** 2-3 hours

#### 5. Settings Toggle
**File:** `src/screens/profile/ProfileScreen.tsx` or new Settings screen

**What it does:**
- Allow users to enable/disable mock mode
- Show current mode status
- Useful for demos

**Estimated Time:** 1-2 hours

**Total Estimated Time for Phase 1:** 11-17 hours (1.5-2 days)

---

## 📋 Phase 2: Real Energy Meter Integration

### ✅ Prerequisites (After Phase 1)
- [x] Fake meter working
- [x] Data flow tested
- [x] UI displaying data correctly

### 🔨 To Build (Priority Order)

#### 1. Meter Protocol Interface ⭐ **START HERE**
**File:** `src/services/meter/protocols/baseProtocol.ts`

**What it does:**
- Define interface for all meter protocols
- Common methods: connect(), disconnect(), getData(), subscribe()

**Estimated Time:** 2-3 hours

#### 2. REST API Adapter (Simplest)
**File:** `src/services/meter/protocols/restApiAdapter.ts`

**What it does:**
- Connect to REST API endpoints
- Poll for data every 15 minutes
- Handle authentication
- Error handling

**Estimated Time:** 4-6 hours

#### 3. Connection Manager
**File:** `src/services/meter/connectionManager.ts`

**What it does:**
- Manage multiple meter connections
- Handle connection failures
- Retry logic
- Health monitoring

**Estimated Time:** 4-6 hours

#### 4. Data Validator
**File:** `src/services/meter/dataValidator.ts`

**What it does:**
- Validate incoming data
- Detect anomalies
- Flag suspicious readings
- Alert on issues

**Estimated Time:** 3-4 hours

#### 5. Real-Time Sync Service
**File:** `src/services/meter/realtimeSync.ts`

**What it does:**
- WebSocket connections
- Polling fallback
- Data batching
- Conflict resolution

**Estimated Time:** 5-7 hours

#### 6. Additional Protocol Adapters (As Needed)
**Files:**
- `src/services/meter/protocols/loraWanAdapter.ts`
- `src/services/meter/protocols/wifiAdapter.ts`
- `src/services/meter/protocols/zigbeeAdapter.ts`
- `src/services/meter/protocols/modbusAdapter.ts`

**Estimated Time:** 8-12 hours each

**Total Estimated Time for Phase 2:** 26-38 hours (3-5 days) for REST API only

---

## 🗂️ File Structure

```
src/
├── services/
│   ├── mock/
│   │   ├── meterSimulator.ts          ⭐ Phase 1
│   │   └── backgroundDataGenerator.ts ⭐ Phase 1
│   ├── meter/
│   │   ├── connectionManager.ts       ⭐ Phase 2
│   │   ├── dataValidator.ts           ⭐ Phase 2
│   │   ├── realtimeSync.ts           ⭐ Phase 2
│   │   └── protocols/
│   │       ├── baseProtocol.ts        ⭐ Phase 2
│   │       ├── restApiAdapter.ts      ⭐ Phase 2
│   │       ├── loraWanAdapter.ts      Phase 2 (later)
│   │       ├── wifiAdapter.ts         Phase 2 (later)
│   │       └── zigbeeAdapter.ts       Phase 2 (later)
│   └── api/
│       └── meterService.ts            ⭐ Update in Phase 1
├── utils/
│   └── meterConfig.ts                 ⭐ Phase 1
└── screens/
    └── profile/
        └── ProfileScreen.tsx          ⭐ Phase 1 (add toggle)
```

---

## 🚀 Implementation Order

### Week 1: Fake Meter (Priority: HIGH)
1. **Day 1:** Create `meterSimulator.ts`
   - Solar generation curve
   - Consumption patterns
   - Basic weather variation

2. **Day 2:** Create `backgroundDataGenerator.ts`
   - Background task
   - Data storage
   - Integration with store

3. **Day 3:** Update `meterService.ts`
   - Mock mode check
   - Integration with simulator
   - Testing

4. **Day 4:** Add configuration and settings
   - `meterConfig.ts`
   - Settings toggle
   - Testing

5. **Day 5:** Polish and testing
   - Error handling
   - Edge cases
   - Documentation

### Week 2-3: Real Meter (Priority: MEDIUM)
1. **Week 2:** Foundation
   - Protocol interface
   - REST API adapter
   - Connection manager

2. **Week 3:** Advanced features
   - Data validator
   - Real-time sync
   - Testing with real meters

---

## 📊 Data Flow Diagrams

### Fake Meter Flow
```
User enables mock mode
    ↓
BackgroundGenerator.start()
    ↓
Every 15 minutes:
    MeterSimulator.generateRealTimeData()
    ↓
meterStore.addEnergyData()
    ↓
SupabaseDatabaseService.insertEnergyData()
    ↓
HomeScreen displays data
```

### Real Meter Flow
```
User connects meter
    ↓
ConnectionManager.connect()
    ↓
Protocol Adapter (REST/LoRaWAN/etc.)
    ↓
DataValidator.validate()
    ↓
meterStore.addEnergyData()
    ↓
SupabaseDatabaseService.insertEnergyData()
    ↓
HomeScreen displays data
```

---

## 🧪 Testing Checklist

### Fake Meter Testing
- [ ] Generates realistic solar curve
- [ ] Generates realistic consumption
- [ ] Weather variations work
- [ ] Data stored in Supabase
- [ ] UI updates correctly
- [ ] Background generation works
- [ ] App state changes handled
- [ ] Multiple meters supported

### Real Meter Testing
- [ ] REST API connection works
- [ ] Data validation works
- [ ] Error handling works
- [ ] Offline handling works
- [ ] Reconnection works
- [ ] Performance is acceptable
- [ ] Multiple meters supported

---

## 📝 Configuration Examples

### Fake Meter Config
```typescript
{
  solarCapacity: 5,        // kW
  dailyTarget: 25,         // kWh
  baseConsumption: 0.5,    // kW
  peakConsumption: 2.0,   // kW
  location: {
    lat: 18.5204,
    lng: 73.8567
  },
  weatherVariation: true
}
```

### Real Meter Config (REST API)
```typescript
{
  protocol: 'rest',
  endpoint: 'https://api.meterprovider.com/data',
  apiKey: 'your_api_key',
  meterId: 'meter_123',
  pollingInterval: 15, // minutes
  timeout: 5000 // ms
}
```

---

## 🎯 Success Criteria

### Fake Meter ✅
- [x] Generates data every 15 minutes
- [x] Data looks realistic
- [x] Stores in Supabase
- [x] UI updates automatically
- [x] Can be enabled/disabled
- [x] Works in background

### Real Meter ✅
- [x] Connects to real meters
- [x] Receives data correctly
- [x] Validates data quality
- [x] Handles errors
- [x] Works offline
- [x] Performance is good

---

## 📚 Documentation Needed

- [ ] API documentation for meter services
- [ ] Protocol specifications
- [ ] Setup guides for each protocol
- [ ] Troubleshooting guide
- [ ] Configuration examples
- [ ] Testing guide

---

## 🔗 Dependencies

### Already Have ✅
- Zustand (state management)
- Supabase (database)
- MMKV (local storage)
- React Native (framework)

### May Need ❌
- `expo-task-manager` (background tasks)
- `react-native-mqtt` (MQTT meters)
- WebSocket library (real-time)

---

## ⚡ Quick Start Commands

### Start Fake Meter Development
```bash
# 1. Create simulator service
touch src/services/mock/meterSimulator.ts

# 2. Create background generator
touch src/services/mock/backgroundDataGenerator.ts

# 3. Create config
touch src/utils/meterConfig.ts

# 4. Start coding!
```

### Start Real Meter Development
```bash
# 1. Create protocol interface
touch src/services/meter/protocols/baseProtocol.ts

# 2. Create REST adapter
touch src/services/meter/protocols/restApiAdapter.ts

# 3. Create connection manager
touch src/services/meter/connectionManager.ts

# 4. Start coding!
```

---

## 🎉 Next Steps

1. **Start with Phase 1** (Fake Meter) - Easier, faster
2. **Test thoroughly** - Make sure everything works
3. **Then Phase 2** (Real Meter) - More complex
4. **Document everything** - For future reference

---

**Status:** Planning Complete ✅  
**Ready to Start:** Phase 1 - Fake Meter Simulation  
**Estimated Total Time:** 2-3 weeks (1 week fake, 2 weeks real)

