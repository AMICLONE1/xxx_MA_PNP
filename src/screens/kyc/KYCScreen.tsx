import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types';
import { useKYCStore } from '@/store';
import { KYC_DOCUMENT_TYPES } from '@/utils/constants';
import DocumentScanScreen from './DocumentScanScreen';
import LivenessCheckScreen from './LivenessCheckScreen';

type KYCScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'KYC'>;

interface Props {
  navigation: KYCScreenNavigationProp;
}

type DocumentType = (typeof KYC_DOCUMENT_TYPES)[number];

const documentConfig: Record<DocumentType, { icon: string; color: string; description: string }> = {
  aadhaar: {
    icon: 'card-account-details',
    color: '#3b82f6',
    description: 'Government issued identity card',
  },
  pan: {
    icon: 'card-account-details-outline',
    color: '#8b5cf6',
    description: 'Permanent Account Number card',
  },
  electricity_bill: {
    icon: 'file-document',
    color: '#10b981',
    description: 'Latest electricity bill',
  },
  gst: {
    icon: 'file-certificate',
    color: '#f59e0b',
    description: 'GST registration certificate',
  },
  society_registration: {
    icon: 'office-building',
    color: '#ef4444',
    description: 'Society registration document',
  },
};

export default function KYCScreen({ navigation }: Props) {
  const { status, setKYCData, isVerified } = useKYCStore();
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showLivenessCheck, setShowLivenessCheck] = useState(false);
  const [documentsScanned, setDocumentsScanned] = useState<string[]>([]);

  const handleDocumentSelect = (docType: DocumentType) => {
    setSelectedDocument(docType);
    setShowScanner(true);
  };

  const handleScanComplete = async (result: { text: string; extractedData: any }) => {
    setShowScanner(false);
    
    if (!selectedDocument) {
      Alert.alert('Error', 'No document selected');
      return;
    }
    
    setDocumentsScanned([...documentsScanned, selectedDocument]);
    
    if (selectedDocument === 'aadhaar' || selectedDocument === 'pan') {
      Alert.alert(
        'Document Scanned',
        'Now please complete the liveness check to verify your identity.',
        [
          {
            text: 'Continue',
            onPress: () => setShowLivenessCheck(true),
          },
        ]
      );
    } else {
      if (!selectedDocument) {
        Alert.alert('Error', 'No document selected');
        return;
      }
      
      setKYCData({
        userId: 'current_user_id',
        documentType: selectedDocument,
        documentNumber: result.extractedData?.consumerNumber,
        status: 'pending',
        submittedAt: new Date(),
      });
    }
  };

  const handleLivenessComplete = async (imageUri: string) => {
    try {
      setShowLivenessCheck(false);
      
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image. Please try again.');
        return;
      }
      
      const scannedDoc = documentsScanned.find((doc) => doc === 'aadhaar' || doc === 'pan');
      if (scannedDoc) {
        setKYCData({
          userId: 'current_user_id',
          documentType: scannedDoc as 'aadhaar' | 'pan',
          status: 'pending',
          submittedAt: new Date(),
        });
      }

      Alert.alert(
        'Verification Submitted',
        'Your identity verification has been submitted. You will be notified once verification is complete.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete liveness check. Please try again.');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'verified':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Verification';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verified':
        return 'check-circle';
      case 'rejected':
        return 'close-circle';
      default:
        return 'clock-outline';
    }
  };

  if (showScanner && selectedDocument) {
    return (
      <DocumentScanScreen
        documentType={selectedDocument}
        onScanComplete={handleScanComplete}
        onCancel={() => setShowScanner(false)}
      />
    );
  }

  if (showLivenessCheck) {
    return (
      <LivenessCheckScreen
        onComplete={handleLivenessComplete}
        onCancel={() => setShowLivenessCheck(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>KYC Verification</Text>
            <Text style={styles.headerSubtitle}>Verify your identity to start trading</Text>
          </View>
          <MaterialCommunityIcons name="shield-check" size={32} color="#ffffff" />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.description}>
            As per government regulations, we need to verify your identity before you can trade energy.
          </Text>

          {status !== 'pending' && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <MaterialCommunityIcons
                name={getStatusIcon() as any}
                size={24}
                color={getStatusColor()}
              />
              <View style={styles.statusBadgeContent}>
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
                <Text style={styles.statusSubtext}>
                  {status === 'verified'
                    ? 'Your identity has been verified'
                    : status === 'rejected'
                    ? 'Please resubmit your documents'
                    : 'Your verification is being processed'}
                </Text>
              </View>
            </View>
          )}

          {!isVerified() && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Identity Documents</Text>
                <Text style={styles.sectionSubtitle}>
                  Upload a government-issued ID to verify your identity
                </Text>

                <TouchableOpacity
                  style={styles.documentButton}
                  onPress={() => navigation.navigate('AadhaarScan')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[documentConfig.aadhaar.color + '20', documentConfig.aadhaar.color + '10']}
                    style={styles.documentButtonGradient}
                  >
                    <View style={[styles.documentIconContainer, { backgroundColor: documentConfig.aadhaar.color + '20' }]}>
                      <MaterialCommunityIcons
                        name={documentConfig.aadhaar.icon as any}
                        size={28}
                        color={documentConfig.aadhaar.color}
                      />
                    </View>
                    <View style={styles.documentButtonContent}>
                      <Text style={styles.documentButtonText}>Scan Aadhaar Card</Text>
                      <Text style={styles.documentButtonSubtext}>
                        {documentConfig.aadhaar.description}
                      </Text>
                    </View>
                    {documentsScanned.includes('aadhaar') && (
                      <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.documentButton}
                  onPress={() => handleDocumentSelect('pan')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[documentConfig.pan.color + '20', documentConfig.pan.color + '10']}
                    style={styles.documentButtonGradient}
                  >
                    <View style={[styles.documentIconContainer, { backgroundColor: documentConfig.pan.color + '20' }]}>
                      <MaterialCommunityIcons
                        name={documentConfig.pan.icon as any}
                        size={28}
                        color={documentConfig.pan.color}
                      />
                    </View>
                    <View style={styles.documentButtonContent}>
                      <Text style={styles.documentButtonText}>Scan PAN Card</Text>
                      <Text style={styles.documentButtonSubtext}>
                        {documentConfig.pan.description}
                      </Text>
                    </View>
                    {documentsScanned.includes('pan') && (
                      <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Documents</Text>
                <Text style={styles.sectionSubtitle}>
                  Upload your electricity bill for meter verification
                </Text>

                <TouchableOpacity
                  style={styles.documentButton}
                  onPress={() => handleDocumentSelect('electricity_bill')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[documentConfig.electricity_bill.color + '20', documentConfig.electricity_bill.color + '10']}
                    style={styles.documentButtonGradient}
                  >
                    <View style={[styles.documentIconContainer, { backgroundColor: documentConfig.electricity_bill.color + '20' }]}>
                      <MaterialCommunityIcons
                        name={documentConfig.electricity_bill.icon as any}
                        size={28}
                        color={documentConfig.electricity_bill.color}
                      />
                    </View>
                    <View style={styles.documentButtonContent}>
                      <Text style={styles.documentButtonText}>Scan Electricity Bill</Text>
                      <Text style={styles.documentButtonSubtext}>
                        {documentConfig.electricity_bill.description}
                      </Text>
                    </View>
                    {documentsScanned.includes('electricity_bill') && (
                      <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Business Documents (Optional)</Text>
                <Text style={styles.sectionSubtitle}>
                  For societies and commercial users
                </Text>

                <TouchableOpacity
                  style={styles.documentButton}
                  onPress={() => handleDocumentSelect('gst')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[documentConfig.gst.color + '20', documentConfig.gst.color + '10']}
                    style={styles.documentButtonGradient}
                  >
                    <View style={[styles.documentIconContainer, { backgroundColor: documentConfig.gst.color + '20' }]}>
                      <MaterialCommunityIcons
                        name={documentConfig.gst.icon as any}
                        size={28}
                        color={documentConfig.gst.color}
                      />
                    </View>
                    <View style={styles.documentButtonContent}>
                      <Text style={styles.documentButtonText}>Upload GST Certificate</Text>
                      <Text style={styles.documentButtonSubtext}>
                        {documentConfig.gst.description}
                      </Text>
                    </View>
                    {documentsScanned.includes('gst') && (
                      <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.documentButton}
                  onPress={() => handleDocumentSelect('society_registration')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[documentConfig.society_registration.color + '20', documentConfig.society_registration.color + '10']}
                    style={styles.documentButtonGradient}
                  >
                    <View style={[styles.documentIconContainer, { backgroundColor: documentConfig.society_registration.color + '20' }]}>
                      <MaterialCommunityIcons
                        name={documentConfig.society_registration.icon as any}
                        size={28}
                        color={documentConfig.society_registration.color}
                      />
                    </View>
                    <View style={styles.documentButtonContent}>
                      <Text style={styles.documentButtonText}>Upload Society Registration</Text>
                      <Text style={styles.documentButtonSubtext}>
                        {documentConfig.society_registration.description}
                      </Text>
                    </View>
                    {documentsScanned.includes('society_registration') && (
                      <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}

          {isVerified() && (
            <View style={styles.verifiedContainer}>
              <LinearGradient
                colors={['#ecfdf5', '#d1fae5']}
                style={styles.verifiedGradient}
              >
                <MaterialCommunityIcons name="check-circle" size={64} color="#10b981" />
                <Text style={styles.verifiedText}>✓ Your identity has been verified</Text>
                <Text style={styles.verifiedSubtext}>
                  You can now participate in energy trading
                </Text>
              </LinearGradient>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  statusBadgeContent: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  documentButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  documentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  documentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentButtonContent: {
    flex: 1,
  },
  documentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  documentButtonSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  verifiedContainer: {
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  verifiedGradient: {
    padding: 32,
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 16,
    marginBottom: 8,
  },
  verifiedSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
