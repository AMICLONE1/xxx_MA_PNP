import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  keyId: string;
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  orderId,
  amount,
  keyId,
  onSuccess,
  onError,
  onClose,
}) => {
  const webViewRef = useRef<WebView>(null);

  // Generate Razorpay checkout HTML
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Razorpay Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 100%;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #111827;
      font-size: 24px;
      margin-bottom: 8px;
    }
    .header p {
      color: #6b7280;
      font-size: 14px;
    }
    .payment-button {
      width: 100%;
      padding: 16px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .payment-button:hover {
      background: #059669;
    }
    .payment-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .amount-display {
      background: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .amount-label {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .amount-value {
      color: #111827;
      font-size: 32px;
      font-weight: bold;
    }
    .loading {
      text-align: center;
      color: #6b7280;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PowerNetPro</h1>
      <p>Complete your payment</p>
    </div>
    
    <div class="amount-display">
      <div class="amount-label">Amount to Pay</div>
      <div class="amount-value">₹${amount.toFixed(2)}</div>
    </div>

    <button id="pay-button" class="payment-button" onclick="openCheckout()">
      Pay ₹${amount.toFixed(2)}
    </button>

    <div id="loading" class="loading" style="display: none;">
      Processing payment...
    </div>
  </div>

  <script>
    const RAZORPAY_KEY_ID = '${keyId}';
    const ORDER_ID = '${orderId}';
    const AMOUNT = ${amount * 100}; // Amount in paise

    function openCheckout() {
      const button = document.getElementById('pay-button');
      const loading = document.getElementById('loading');
      
      button.disabled = true;
      button.textContent = 'Processing...';
      loading.style.display = 'block';

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: AMOUNT,
        currency: 'INR',
        name: 'PowerNetPro',
        description: 'Wallet Top-up',
        order_id: ORDER_ID,
        handler: function(response) {
          // Payment successful
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_SUCCESS',
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            }));
          }
        },
        prefill: {
          // You can prefill user details here if available
        },
        theme: {
          color: '#10b981',
        },
        modal: {
          ondismiss: function() {
            // User closed the checkout
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_CLOSED',
              }));
            }
          },
        },
      };

      const razorpay = new Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', function(response) {
        // Payment failed
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_FAILED',
            error: response.error.description || 'Payment failed',
          }));
        }
      });
    }

    // Auto-open checkout when page loads
    window.addEventListener('load', function() {
      setTimeout(openCheckout, 500);
    });
  </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'PAYMENT_SUCCESS':
          onSuccess(data.paymentId, data.orderId, data.signature);
          break;
        case 'PAYMENT_FAILED':
          onError(data.error || 'Payment failed');
          break;
        case 'PAYMENT_CLOSED':
          onClose();
          break;
      }
    } catch (error) {
      console.error('Error parsing Razorpay message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
});

