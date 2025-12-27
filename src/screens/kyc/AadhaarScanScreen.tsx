import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types';
import { ocrService } from '@/services/mlkit/ocrService';
import { useKYCStore, useAuthStore } from '@/store';
import * as FileSystem from 'expo-file-system';

type AadhaarScanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AadhaarScan'>;

interface Props {
  navigation: AadhaarScanScreenNavigationProp;
}

interface ExtractedData {
  fullName: string;
  aadhaarNumber: string;
  dateOfBirth: string;
  address: string;
}

export default function AadhaarScanScreen({ navigation }: Props) {
  const { setKYCData } = useKYCStore();
  const { user } = useAuthStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    fullName: '',
    aadhaarNumber: '',
    dateOfBirth: '',
    address: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  /**
   * Mask Aadhaar number: XXXX-XXXX-1234
   */
  const maskAadhaarNumber = (aadhaar: string): string => {
    if (!aadhaar || aadhaar.length !== 12) {
      return aadhaar;
    }
    const last4 = aadhaar.slice(-4);
    return `XXXX-XXXX-${last4}`;
  };

  /**
   * Extract Aadhaar data from OCR text
   */
  const extractAadhaarData = (ocrText: string): ExtractedData => {
    const data: ExtractedData = {
      fullName: '',
      aadhaarNumber: '',
      dateOfBirth: '',
      address: '',
    };

    // Extract Aadhaar number (12 digits, may have spaces or dashes)
    const aadhaarPattern = /\b(\d{4})\s*-?\s*(\d{4})\s*-?\s*(\d{4})\b/;
    const aadhaarMatch = ocrText.match(aadhaarPattern);
    if (aadhaarMatch) {
      data.aadhaarNumber = aadhaarMatch[1] + aadhaarMatch[2] + aadhaarMatch[3];
    }

    // Extract Date of Birth (common formats: DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY)
    const dobPatterns = [
      /\b(\d{2})\/(\d{2})\/(\d{4})\b/, // DD/MM/YYYY
      /\b(\d{2})-(\d{2})-(\d{4})\b/, // DD-MM-YYYY
      /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i, // DD MMM YYYY
    ];

    for (const pattern of dobPatterns) {
      const dobMatch = ocrText.match(pattern);
      if (dobMatch) {
        if (pattern === dobPatterns[2]) {
          // DD MMM YYYY format
          const months: { [key: string]: string } = {
            jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
            jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
          };
          const month = months[dobMatch[2].toLowerCase().substring(0, 3)];
          data.dateOfBirth = `${dobMatch[1].padStart(2, '0')}/${month}/${dobMatch[3]}`;
        } else {
          data.dateOfBirth = `${dobMatch[1]}/${dobMatch[2]}/${dobMatch[3]}`;
        }
        break;
      }
    }

    // Extract Name (look for text before "DOB" or "Year of Birth" or similar patterns)
    const namePatterns = [
      /(?:Name|नाम|NAME)\s*:?\s*([A-Z][A-Z\s]+?)(?:\s+(?:DOB|Year|Date|जन्म))/i,
      /^([A-Z][A-Z\s]{3,30})(?:\s+(?:DOB|Year|Date))/i,
      /(?:Government of India|भारत सरकार)\s+([A-Z][A-Z\s]+?)(?:\s+(?:DOB|Year|Date))/i,
    ];

    for (const pattern of namePatterns) {
      const nameMatch = ocrText.match(pattern);
      if (nameMatch && nameMatch[1]) {
        data.fullName = nameMatch[1].trim();
        break;
      }
    }

    // If name not found, try to find the longest capitalized word sequence at the top
    if (!data.fullName) {
      const lines = ocrText.split('\n').slice(0, 5); // First 5 lines
      for (const line of lines) {
        const words = line.trim().split(/\s+/);
        if (words.length >= 2 && words.every(w => /^[A-Z][a-z]+$/.test(w))) {
          data.fullName = words.join(' ');
          break;
        }
      }
    }

    // Extract Address (text after Aadhaar number, before end or other keywords)
    const addressPattern = /(?:Address|पता|ADDRESS)[\s:]*([^\n]+(?:\n[^\n]+)*?)(?:\n\n|\n[A-Z]{2,}|$)/i;
    const addressMatch = ocrText.match(addressPattern);
    if (addressMatch && addressMatch[1]) {
      data.address = addressMatch[1].trim().replace(/\s+/g, ' ');
    } else {
      // Fallback: get text after DOB line
      const lines = ocrText.split('\n');
      const dobIndex = lines.findIndex(line => /DOB|Date|Year/.test(line));
      if (dobIndex >= 0 && dobIndex < lines.length - 1) {
        const addressLines = lines.slice(dobIndex + 1, dobIndex + 5);
        data.address = addressLines.join(' ').trim();
      }
    }

    return data;
  };

  /**
   * Handle image upload
   */
  const handleUploadImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload Aadhaar image.');
        return;
      }

      // Show image picker options
      Alert.alert(
        'Select Aadhaar Image',
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraStatus.status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant camera permissions.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                await processImage(result.assets[0].uri);
              }
            },
          },
          {
            text: 'Photo Library',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                await processImage(result.assets[0].uri);
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error picking image:', error);
      }
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };

  /**
   * Process image with OCR
   */
  const processImage = async (uri: string) => {
    setIsProcessing(true);
    setImageUri(uri);
    setShowForm(false);
    setExtractedData({
      fullName: '',
      aadhaarNumber: '',
      dateOfBirth: '',
      address: '',
    });

    try {
      // Perform OCR
      const ocrResult = await ocrService.recognizeText(uri);
      
      if (__DEV__) {
        console.log('OCR Text:', ocrResult.text);
      }

      // Extract Aadhaar data
      const extracted = extractAadhaarData(ocrResult.text);
      
      // Also try using the service's built-in extractor
      const aadhaarNumber = ocrService.extractAadhaarNumber(ocrResult);
      if (aadhaarNumber && !extracted.aadhaarNumber) {
        extracted.aadhaarNumber = aadhaarNumber;
      }

      const name = ocrService.extractName(ocrResult);
      if (name && !extracted.fullName) {
        extracted.fullName = name;
      }

      setExtractedData(extracted);
      setShowForm(true);

      // Delete image file immediately after OCR
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (deleteError) {
        if (__DEV__) {
          console.warn('Failed to delete image:', deleteError);
        }
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('OCR Error:', error);
      }
      Alert.alert('OCR Failed', error.message || 'Failed to extract text from image. Please try again with a clearer image.');
      setImageUri(null);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = () => {
    if (!isConfirmed) {
      Alert.alert('Confirmation Required', 'Please confirm that the Aadhaar details are correct.');
      return;
    }

    if (!extractedData.aadhaarNumber || extractedData.aadhaarNumber.length !== 12) {
      Alert.alert('Invalid Aadhaar Number', 'Please ensure a valid 12-digit Aadhaar number is extracted.');
      return;
    }

    // Set KYC data with pending status
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please sign in again.');
      return;
    }

    setKYCData({
      userId: user.id,
      documentType: 'aadhaar',
      documentNumber: extractedData.aadhaarNumber,
      status: 'pending',
      submittedAt: new Date(),
    });

    Alert.alert(
      'Success',
      'Your Aadhaar details have been submitted for verification. You will be notified once verification is complete.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Scan Aadhaar Card</Text>
            <Text style={styles.headerSubtitle}>Upload and extract details</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {!showForm && (
            <View style={styles.uploadSection}>
              <View style={styles.uploadIconContainer}>
                <MaterialCommunityIcons name="card-account-details" size={64} color="#10b981" />
              </View>
              <Text style={styles.uploadTitle}>Upload Aadhaar Image</Text>
              <Text style={styles.uploadSubtitle}>
                Take a clear photo or select from gallery. Ensure all text is visible.
              </Text>

              {imageUri && isProcessing && (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text style={styles.processingText}>Processing image with OCR...</Text>
                </View>
              )}

              {imageUri && !isProcessing && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
                </View>
              )}

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadImage}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.uploadButtonGradient}
                >
                  <Ionicons name="camera" size={24} color="#ffffff" />
                  <Text style={styles.uploadButtonText}>
                    {imageUri ? 'Upload Another Image' : 'Upload Aadhaar Image'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {showForm && (
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Review Extracted Details</Text>
              <Text style={styles.formSubtitle}>
                Please review and edit the extracted information if needed.
              </Text>

              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={extractedData.fullName}
                  onChangeText={(text) => setExtractedData({ ...extractedData, fullName: text })}
                  placeholder="Enter full name"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Aadhaar Number (Read-only, masked) */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Aadhaar Number</Text>
                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={maskAadhaarNumber(extractedData.aadhaarNumber)}
                  editable={false}
                  placeholder="XXXX-XXXX-XXXX"
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.readOnlyHint}>This field cannot be edited</Text>
              </View>

              {/* Date of Birth */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  value={extractedData.dateOfBirth}
                  onChangeText={(text) => setExtractedData({ ...extractedData, dateOfBirth: text })}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Address */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={extractedData.address}
                  onChangeText={(text) => setExtractedData({ ...extractedData, address: text })}
                  placeholder="Enter address"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Confirmation Checkbox */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setIsConfirmed(!isConfirmed)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkboxBox, isConfirmed && styles.checkboxBoxChecked]}>
                    {isConfirmed && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I confirm the above Aadhaar details are correct
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, !isConfirmed && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!isConfirmed}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={isConfirmed ? ['#10b981', '#059669'] : ['#9ca3af', '#6b7280']}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Submit for Verification</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Retake Button */}
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => {
                  setShowForm(false);
                  setImageUri(null);
                  setExtractedData({
                    fullName: '',
                    aadhaarNumber: '',
                    dateOfBirth: '',
                    address: '',
                  });
                  setIsConfirmed(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.retakeButtonText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  gradientHeader: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d1fae5',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  uploadSection: {
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  processingContainer: {
    alignItems: 'center',
    marginVertical: 24,
    padding: 24,
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  imagePreviewContainer: {
    width: '100%',
    maxHeight: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#f3f4f6',
  },
  imagePreview: {
    width: '100%',
    height: 300,
  },
  uploadButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  uploadButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  formSection: {
    marginTop: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  readOnlyInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  readOnlyHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxBoxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  retakeButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
});

