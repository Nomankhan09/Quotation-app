import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { router, useLocalSearchParams } from 'expo-router';
import { setSelectedLead, setEditMode } from '@/store/slices/quotationBuilderSlice';
import { addLead, Lead } from '@/store/slices/leadsSlice';
import {
  ArrowLeft,
  Search,
  User,
  Building,
  Mail,
  Check,
  Plus,
  X,
  Phone,
  Users,
  Briefcase,
  UserPlus,
  MapPin,
} from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import Avatar from '@/utils/avatar';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { Camera } from 'lucide-react-native';
import { SOURCE_OPTIONS } from '@/constants/constant';

// lead item 
const LeadItem = React.memo(({ item, selectedLead, onSelect }: { item: any, selectedLead: any, onSelect: any }) => {
  const isSelected = selectedLead === item.id;

  return (
    <TouchableOpacity
      style={[styles.leadCard, isSelected && styles.selectedCard]}
      onPress={() => onSelect(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.leadContent}>
        <Avatar height={45} width={45} item={item} />

        <View style={styles.leadInfo}>
          <Text style={[styles.leadName, isSelected && styles.leadNameSelected]}>
            {item.full_name}
          </Text>

          <View style={styles.leadDetails}>
            <View style={styles.leadDetailRow}>
              <Briefcase size={14} color="#94A3B8" />
              <Text style={styles.leadDetailText}>{item.company_name}</Text>
            </View>

            {item.email && item.email !== 'NA' && (
              <View style={styles.leadDetailRow}>
                <Mail size={14} color="#94A3B8" />
                <Text style={styles.leadDetailText} numberOfLines={1}>
                  {item.email}
                </Text>
              </View>
            )}

            {item.phone && (
              <View style={styles.leadDetailRow}>
                <Phone size={14} color="#94A3B8" />
                <Text style={styles.leadDetailText}>{item.phone}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {isSelected && (
        <View style={styles.checkmarkWrapper}>
          <View style={styles.checkmark}>
            <Check size={16} color="#FFFFFF" />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function SelectLeadScreen() {
  const { leads } = useSelector((state: RootState) => state.leads);
  const { selectedLead, isEditMode, editingQuotationId, prefillData: persistedPrefillData } = useSelector((state: RootState) => state.quotationBuilder);
  const dispatch = useDispatch<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const params = useLocalSearchParams();
  const editMode = params.editMode === 'true';
  const [showStagePicker, setShowStagePicker] = useState(false);
  const urlPrefillData = params.prefillData ? JSON.parse(params.prefillData as string) : null;
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const prefillData = persistedPrefillData || urlPrefillData;
  const { statuses } = useSelector(
    (state: RootState) => state.contactStatus
  );

  const hasSetEditMode = useRef(false);
  const hasRestoredSelectedLead = useRef(false);

  const { control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      company_name: '',
      notes: '',
      location: '',
      stage: "New",
      job_title: '',
      source: '',
      custom_source: '',
      profile_image: '',
    }
  });
  const stage = watch("stage");
  const selectedSource = watch('source');
  const profileImage = watch('profile_image');

  // only edit mode
  useEffect(() => {
    if (editMode && !hasSetEditMode.current) {
      dispatch(setEditMode({
        isEditMode: true,
        quotationId: params.quotationId as string,
        prefillData: prefillData,
      }));
      hasSetEditMode.current = true;
    }
  }, [editMode]);

  useEffect(() => {
    if (hasRestoredSelectedLead.current) return;

    if (selectedLead) {
      hasRestoredSelectedLead.current = true;
      return;
    }

    if (prefillData?.leadId) {
      dispatch(setSelectedLead(prefillData.leadId));
      hasRestoredSelectedLead.current = true;
    }
  }, [selectedLead, prefillData]);

  // debounce for search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredLeads = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return leads.filter(lead =>
      lead?.full_name?.toLowerCase().includes(q) ||
      lead?.company_name?.toLowerCase().includes(q) ||
      lead?.email?.toLowerCase().includes(q)
    );
  }, [leads, debouncedQuery]);

  const handleSelectLead = useCallback((leadId: string) => {
    dispatch(setSelectedLead(Number(leadId)));
    router.back();
  }, [dispatch]);

  const onSubmit = async (data: any) => {
    try {
      setIsCreateLoading(true);
      const finalSource =
        data.source === 'Other'
          ? data.custom_source
          : data.source;

      const payload = {
        ...data,
        source: finalSource,
      };

      delete payload.custom_source;

      if (!payload.email) {
        payload.email = "NA";
      }
      const createdLead = await dispatch(addLead(payload)).unwrap();

      dispatch(setSelectedLead(createdLead.id));
      reset();
      setShowAddModal(false);

      Alert.alert('Success', 'Contact added successfully!');
      router.back();
    } catch (error: any) {
      console.log('Create Lead Error:', error);
    } finally {
      setIsCreateLoading(false);
    }
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/quotations');
    }
  };

  // Profile image selection
  const pickImage = async () => {

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

    if (!result.canceled) {

      const asset = result.assets[0];

      const base64Image =
        `data:image/jpeg;base64,${asset.base64}`;

      setValue(
        'profile_image',
        base64Image
      );
    }
  };

  const renderLeadItem = useCallback(({ item }: { item: any }) => {
    return (<LeadItem item={item} selectedLead={selectedLead} onSelect={handleSelectLead} />)
  }, [selectedLead]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrapper}>
        <Users size={56} color="#CBD5E1" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No contacts found' : 'No contacts yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try adjusting your search terms'
          : 'Add your first contact to get started'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <UserPlus size={20} color="#FFFFFF" />
          <Text style={styles.emptyButtonText}>Add Contact</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>Select Client</Text>
          <Text style={styles.subtitle}>
            {filteredLeads.length} contact{filteredLeads.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, company, or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#CBD5E1"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Selected Info Banner */}
      {selectedLead && (
        <View style={styles.selectedBanner}>
          <View style={styles.selectedBannerContent}>
            <Check size={16} color="#10B981" />
            <Text style={styles.selectedBannerText}>
              {leads.find(l => Number(l.id) === selectedLead)?.full_name} selected
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => dispatch(setSelectedLead(''))}
            activeOpacity={0.7}
          >
            <X size={18} color="#10B981" />
          </TouchableOpacity>
        </View>
      )}

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        renderItem={renderLeadItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContainer,
          filteredLeads.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Add Lead Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIconWrapper}>
                <UserPlus size={24} color="#3B82F6" />
              </View>
              <Text style={styles.modalTitle}>Add New Contact</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView
            style={styles.formScrollView}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formSection}>
              <Text style={styles.formSectionLabel}>Basic Information</Text>

              {/* Profile Image */}
              <View style={styles.avatarSection}>

                <TouchableOpacity
                  style={styles.avatarWrapper}
                  onPress={pickImage}
                >

                  {profileImage ? (

                    <Image
                      source={{ uri: profileImage }}
                      style={styles.avatarImage}
                    />

                  ) : (

                    <View style={styles.avatarPlaceholder}>
                      <Camera size={30} color="#64748B" />
                    </View>
                  )}

                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickImage}
                >
                  <Text style={styles.addPhotoText}>
                    Add Photo
                  </Text>
                </TouchableOpacity>

              </View>

              {/* Full Name */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#94A3B8" />
                  <Controller
                    control={control}
                    name="full_name"
                    rules={{ required: 'Full name is required' }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Enter full name"
                        value={value}
                        onChangeText={onChange}
                        placeholderTextColor="#CBD5E1"
                      />
                    )}
                  />

                </View>
                {errors.full_name && (
                  <Text style={{ color: 'red' }}>
                    {errors.full_name.message}
                  </Text>
                )}
              </View>

              {/* Phone number */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={20} color="#94A3B8" />
                  <Controller
                    control={control}
                    name="phone"
                    rules={{
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Phone number must be exactly 10 digits',
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="+1 (555) 000-0000"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="phone-pad"
                        placeholderTextColor="#CBD5E1"
                      />
                    )}
                  />

                </View>
                {errors.phone && (
                  <Text style={{ color: 'red' }}>{errors.phone.message}</Text>
                )}
              </View>

              {/* Location */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Location *</Text>
                <View style={styles.inputWrapper}>
                  <MapPin size={20} color="#94A3B8" />
                  <Controller
                    control={control}
                    name="location"
                    rules={{ required: 'Location is required' }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.input, styles.multilineInput]}
                        placeholder="Enter location"
                        value={value}
                        onChangeText={onChange}
                        multiline
                        textAlignVertical="top"
                        scrollEnabled
                        placeholderTextColor="#CBD5E1"
                      />
                    )}
                  />

                </View>
                {errors.location && (
                  <Text style={{ color: 'red' }}>
                    {errors.location.message}
                  </Text>
                )}
              </View>

              {/* Stage */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Stage *</Text>

                <TouchableOpacity
                  style={styles.stageSelector}
                  onPress={() => setShowStagePicker(!showStagePicker)}
                >
                  <Text style={styles.stageSelectorText}>{stage}</Text>
                  <Text>{showStagePicker ? "▲" : "▼"}</Text>
                </TouchableOpacity>

                {showStagePicker && (
                  <View style={styles.stageDropdown}>
                    {statuses.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.stageOption,
                          stage === item.status && styles.stageOptionActive,
                        ]}
                        onPress={() => {
                          setValue("stage", item.status);
                          setShowStagePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.stageOptionText,
                            stage === item.status && styles.stageOptionTextActive,
                          ]}
                        >
                          {item.status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>


            <View style={styles.formSection}>
              <Text style={styles.formSectionLabel}>Optional Fields</Text>

              {/* EMail */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#94A3B8" />
                  <Controller
                    control={control}
                    name="email"
                    rules={{
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Invalid email address',
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="email@example.com"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#CBD5E1"
                      />
                    )}
                  />

                </View>
                {errors.email && (
                  <Text style={{ color: 'red' }}>{errors.email.message}</Text>
                )}
              </View>

              {/* Source */}
              <View style={styles.formGroup}>

                <Text style={styles.inputLabel}>
                  Lead Source
                </Text>

                <Controller
                  control={control}
                  name="source"
                  render={({ field: { value } }) => (

                    <View style={styles.sourceWrap}>

                      {SOURCE_OPTIONS.map((item) => {

                        const active =
                          value === item;

                        return (

                          <TouchableOpacity
                            key={item}
                            style={[
                              styles.sourceChip,
                              active &&
                              styles.sourceChipActive
                            ]}
                            onPress={() =>
                              setValue(
                                'source',
                                item
                              )
                            }
                          >

                            <Text
                              style={[
                                styles.sourceChipText,
                                active &&
                                styles.sourceChipTextActive
                              ]}
                            >
                              {item}
                            </Text>

                          </TouchableOpacity>
                        );
                      })}

                    </View>
                  )}
                />

                {selectedSource === 'Other' && (

                  <Controller
                    control={control}
                    name="custom_source"
                    render={({
                      field: {
                        onChange,
                        value
                      }
                    }) => (

                      <TextInput
                        style={[
                          styles.textArea,
                          { marginTop: 12 }
                        ]}
                        placeholder="Enter custom source"
                        value={value}
                        onChangeText={onChange}
                        placeholderTextColor="#CBD5E1"
                      />
                    )}
                  />
                )}

              </View>

              {/* Company */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Company </Text>
                <View style={styles.inputWrapper}>
                  <Building size={20} color="#94A3B8" />
                  <Controller
                    control={control}
                    name="company_name"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Enter company name"
                        value={value}
                        onChangeText={onChange}
                        placeholderTextColor="#CBD5E1"
                      />
                    )}
                  />
                </View>
              </View>

              {/* JOB TITLE */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Job title</Text>
                <View style={styles.inputWrapper}>
                  <Controller
                    control={control}
                    name="job_title"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        placeholder="Head of Engineering"
                        placeholderTextColor="#9e9e9d"
                      />
                    )}
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>Additional Notes</Text>

                <View style={styles.formGroup}>
                  <Controller
                    control={control}
                    name="notes"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Add any additional notes..."
                        value={value}
                        onChangeText={onChange}
                        multiline
                        numberOfLines={4}
                        placeholderTextColor="#CBD5E1"
                        textAlignVertical="top"
                      />
                    )}
                  />
                </View>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.8}
            >
              <UserPlus size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {isCreateLoading ? 'Saving...' : 'Add Contact'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Search
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },

  // Selected Banner
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#D1FAE5',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  selectedBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },

  // List
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Lead Card
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  leadContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  leadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  leadNameSelected: {
    color: '#3B82F6',
  },
  leadDetails: {
    gap: 4,
  },
  leadDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leadDetailText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  checkmarkWrapper: {
    marginLeft: 12,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 32,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  modalIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Form
  formScrollView: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  multilineInput: {
    minHeight: 50,
    maxHeight: 120,
    paddingTop: 10,
  },
  fieldWrapper: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '##565553',
    marginBottom: 6,
  },
  // Stage custom selector
  stageSelector: {
    height: 44,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  stageSelectorText: {
    fontSize: 15,
    color: '#111827',
  },
  chevron: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  stageDropdown: {
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 4,
  },
  stageOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  stageOptionActive: {
    backgroundColor: '#F9FAFB',
  },
  stageOptionText: {
    fontSize: 15,
    color: '#374151',
  },
  stageOptionTextActive: {
    fontWeight: '600',
    color: '#111827',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },

  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 10,
  },

  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 50,
    borderStyle: 'dashed',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  addPhotoText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 14,
  },

  sourceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  sourceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },

  sourceChipActive: {
    backgroundColor: '#DBEAFE',
  },

  sourceChipText: {
    color: '#475569',
    fontWeight: '600',
  },

  sourceChipTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
});