# Razorpay Integration Guide

## ✅ Status: Keys Added to Railway

You've added Razorpay keys to Railway environment variables. Now let's complete the integration!

---

## 📋 Next Steps

### Step 1: Verify Railway Environment Variables ✅

**In Railway Dashboard:**
- Go to your service → Settings → Variables
- Verify these are set:
  ```
  RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
  RAZORPAY_KEY_SECRET=your_secret_key
  ```

**Status:** ✅ Already done!

---

### Step 2: Test Backend Payment Endpoint

**Test the top-up endpoint:**
```bash
# Get auth token first (from Supabase)
curl -X POST https://xxxmapnp-production.up.railway.app/wallet/top-up \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 100, "paymentMethod": "upi"}'
```

**Should return:**
```json
{
  "success": true,
  "data": {
    "paymentId": "order_xxxxx",
    "orderId": "order_xxxxx",
    "amount": 100,
    "status": "pending"
  }
}
```

---

### Step 3: Install Razorpay SDK (Mobile App)

**For Expo:**
Razorpay React Native SDK requires native code, so you'll need a **development build** (not Expo Go).

**Option A: Use Razorpay Checkout (Web-based)** ⭐ **RECOMMENDED for Expo Go**

This works in Expo Go without native build!

**Option B: Development Build**
```bash
# Install Razorpay
npm install react-native-razorpay

# Create development build
npx expo prebuild
npx expo run:android  # or run:ios
```

---

### Step 4: Update Payment Service

The backend is already configured. Now update the mobile app to:
1. Call backend to create Razorpay order
2. Open Razorpay checkout
3. Verify payment

---

## 🎯 Recommended Approach

### For Now (Expo Go Compatible):

**Use Razorpay Checkout via WebView:**
1. Backend creates Razorpay order ✅ (already done)
2. Mobile app opens Razorpay checkout URL in WebView
3. User completes payment
4. Webhook/redirect handles verification

**Pros:**
- ✅ Works in Expo Go
- ✅ No native build needed
- ✅ Easy to implement

**Cons:**
- ⚠️ Requires WebView
- ⚠️ Less native feel

---

### For Production:

**Use Razorpay React Native SDK:**
1. Create development build
2. Install `react-native-razorpay`
3. Use native checkout

**Pros:**
- ✅ Native experience
- ✅ Better UX

**Cons:**
- ⚠️ Requires development build
- ⚠️ More setup

---

## 🚀 Quick Implementation (WebView Approach)

I'll update the payment service to use Razorpay checkout URL in a WebView. This works immediately in Expo Go!

---

## 📝 What's Already Done

- ✅ Backend Razorpay integration
- ✅ Railway environment variables set
- ✅ Backend endpoints ready
- ✅ Payment service structure

---

## ⏳ What's Next

1. **Update payment service** - Add Razorpay checkout URL handling
2. **Update TopUpScreen** - Open Razorpay checkout
3. **Test payment flow** - End-to-end testing
4. **Handle webhooks** - Payment verification

---

**Let me implement the WebView-based Razorpay checkout for you!**

