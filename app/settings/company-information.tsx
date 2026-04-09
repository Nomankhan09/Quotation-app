import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { router } from 'expo-router';
import { ChevronLeft, Camera, Building, MapPin, Phone, Globe, Save, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateCompanyInformation } from '@/store/slices/authSlice';

export default function CompanyInformationScreen() {
  const { user, token, updatingCompany } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  
  const [formData, setFormData] = useState({
    company_name: user?.company_name || '',
    company_address: user?.company_address || '',
    zip_code: user?.zip_code || '',
    company_phone: user?.company_phone || '',
    website: user?.website || '',
    company_logo: user?.company_logo || '',
  });
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      Alert.alert('Error', 'Company name is required');
      return;
    }

    try {
      const submitData = {
        ...formData,
        company_logo: logoBase64 || formData.company_logo || '',
      };

      const result = await dispatch(updateCompanyInformation(submitData)).unwrap();
      
      Alert.alert('Success', 'Company information updated successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to update company information');
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 2],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const base64String = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setLogoBase64(base64String);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera permissions to make this work!');
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 2], // Rectangle aspect ratio
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const base64String = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setLogoBase64(base64String);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeLogo = async () => {
    setLogoBase64(null);
    setFormData(prev => ({ ...prev, company_logo: '' }));
  };

  const handleLogoUpload = () => {
    const alertButtons: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }> = [
      {
        text: 'Take Photo',
        onPress: () => { void takePhoto(); },
      },
      {
        text: 'Choose from Gallery',
        onPress: () => { void pickImage(); },
      },
    ];

    // Add remove option only if there's a logo
    if (logoBase64 || formData.company_logo) {
      alertButtons.push({
        text: 'Remove Logo',
        onPress: () => { removeLogo(); },
        style: 'destructive',
      });
    }

    alertButtons.push({
      text: 'Cancel',
      style: 'cancel',
    });

    Alert.alert('Upload Logo', 'Choose an option', alertButtons);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getLogoSource = () => {
    if (logoBase64) {
      return { uri: logoBase64 };
    }
    if (formData.company_logo) {
      return { uri: "https://crmapp.flairm.com/quotepro/public/" + formData.company_logo };
    }
    return null;
  };

  const logoSource = getLogoSource();

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company Information</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Logo Upload Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            {logoSource ? (
              <View style={styles.logoWithRemove}>
                <Image 
                  source={logoSource} 
                  style={styles.logoImage}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.removeLogoButton}
                  onPress={removeLogo}
                >
                  <Trash2 size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.logoPlaceholder}>
                <Building size={40} color="#64748B" />
                <Text style={styles.logoPlaceholderText}>Company Logo</Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.logoUploadButton}
              onPress={handleLogoUpload}
            >
              <Camera size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.logoText}>Company Logo</Text>
          <Text style={styles.logoSubtext}>Tap to upload or change</Text>
          <Text style={styles.logoHint}>Recommended: 3:2 ratio, JPG/PNG</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Company Name */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelRow}>
              <Building size={16} color="#64748B" />
              <Text style={styles.inputLabel}>Company Name *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter company name"
              value={formData.company_name}
              onChangeText={(value) => updateField('company_name', value)}
              placeholderTextColor="#94A3B8"
              returnKeyType="next"
            />
          </View>

          {/* Company Address */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelRow}>
              <MapPin size={16} color="#64748B" />
              <Text style={styles.inputLabel}>Company Address</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter company address"
              value={formData.company_address}
              onChangeText={(value) => updateField('company_address', value)}
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="next"
            />
          </View>

          {/* Zip Code */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelRow}>
              <MapPin size={16} color="#64748B" />
              <Text style={styles.inputLabel}>Zip Code</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter zip code"
              value={formData.zip_code}
              onChangeText={(value) => updateField('zip_code', value)}
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              returnKeyType="next"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelRow}>
              <Phone size={16} color="#64748B" />
              <Text style={styles.inputLabel}>Phone</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              value={formData.company_phone}
              onChangeText={(value) => updateField('company_phone', value)}
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>

          {/* Website */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelRow}>
              <Globe size={16} color="#64748B" />
              <Text style={styles.inputLabel}>Website</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter website URL"
              value={formData.website}
              onChangeText={(value) => updateField('website', value)}
              placeholderTextColor="#94A3B8"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Spacer for button */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, updatingCompany && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={updatingCompany}
        >
          {updatingCompany ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  logoSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginVertical: 16,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  logoWithRemove: {
    position: 'relative',
  },
  logoImage: {
    width: 220,
    height: 130,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  removeLogoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoPlaceholder: {
    width: 150,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  logoPlaceholderText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  logoUploadButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  logoHint: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 30,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  spacer: {
    height: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 70,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});