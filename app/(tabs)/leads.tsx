import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Platform,
  StyleSheet
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import {
  setSearch,
} from '@/store/slices/leadsSlice';
import {
  Plus,
  Search,
  Mail,
  Phone,
  X,
  MapPin,
} from 'lucide-react-native';
import { Lead, addLead } from '@/store/slices/leadsSlice';
import { Controller, useForm } from 'react-hook-form';
import { StageBadge } from '@/utils/stageBadge';
import Avatar from '@/utils/avatar';
import { STAGES } from '@/constants/constant';

export default function LeadsScreen() {
  const dispatch = useDispatch<any>();
  const { leads, search } = useSelector(
    (state: RootState) => state.leads
  );
  const [showStagePicker, setShowStagePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState(search);
  const [showAddModal, setShowAddModal] = useState(false);

  // Simple local search
  const filteredLeads = leads.filter(lead =>
    lead.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    dispatch(setSearch(text));
  };

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: "",
      company_name: "",
      job_title: "",
      email: "",
      phone: "",
      stage: "Lead",
      location: "",
    },
  });
  const stage = watch("stage");

  const onSubmit = (data: any) => {
    if (!data.email) {
      data.email = "NA"
    }

    dispatch(addLead(data));
    handleClose();
    Alert.alert('Success', 'Contact added successfully!');
  };


  const handleClose = () => {
    setShowAddModal(false);
    reset();
  };

  useEffect(() => {
    if (showAddModal) {
      reset();
    }
  }, [showAddModal]);

  const renderLeadItem = ({ item }) => (
    <TouchableOpacity style={styles.leadCard}>
      <View style={styles.row}>
        {/* Avatar */}
        <Avatar item={item} />

        {/* Name + Phone */}
        <View style={{ flex: 1 }}>
          <Text style={styles.leadName}>{item.full_name}</Text>

          {item.phone && (
            <Text style={styles.phoneText}>{item.phone}</Text>
          )}
        </View>

        {/* Stage Badge */}
        {item.stage && (
          <StageBadge stage={item.stage} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        renderItem={renderLeadItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add Lead Modal with Keyboard Handling */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            {/* Drag handle */}
            <View style={styles.dragHandleWrapper}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add Contact</Text>

              <TouchableOpacity onPress={handleClose}>
                <X size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* FULL NAME */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Full name *</Text>
                <Controller
                  control={control}
                  name="full_name"
                  rules={{
                    required: "Full name is required",
                  }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Full Name"
                      placeholderTextColor="#9e9e9d"
                    />
                  )}
                />
                {errors.full_name && (
                  <Text style={styles.errorText}>{errors.full_name.message}</Text>
                )}
              </View>

              {/* PHONE */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Phone *</Text>
                <Controller
                  control={control}
                  name="phone"
                  rules={{
                    required: "Phone is required",
                    pattern: {
                      value: /^[0-9+\-\s]{7,15}$/,
                      message: "Enter valid phone number",
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      placeholder="+91 98XXXXXXXX"
                      placeholderTextColor="#9e9e9d"
                      keyboardType="phone-pad"
                    />
                  )}
                />
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone.message}</Text>
                )}
              </View>

              {/* Location */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Location *</Text>
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

                {/* </View> */}
                {errors.location && (
                  <Text style={{ color: 'red' }}>
                    {errors.location.message}
                  </Text>
                )}
              </View>


              {/* STAGE */}
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
                    {STAGES.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.stageOption,
                          stage === item && styles.stageOptionActive,
                        ]}
                        onPress={() => {
                          setValue("stage", item);
                          setShowStagePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.stageOptionText,
                            stage === item && styles.stageOptionTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* EMAIL */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Email</Text>
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Invalid email",
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        placeholder="raj@acme.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      {errors.email && (
                        <Text style={styles.errorText}>
                          {errors.email.message}
                        </Text>
                      )}
                    </View>
                  )}
                />
              </View>

              {/* COMPANY */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Company</Text>
                <Controller
                  control={control}
                  name="company_name"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Acme Corp"
                      placeholderTextColor="#9e9e9d"
                    />
                  )}
                />
              </View>

              {/* JOB TITLE */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Job title</Text>
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

              {/* BUTTONS */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit(onSubmit)}
              >
                <Text style={styles.saveButtonText}>Save contact</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  leadCompany: {
    fontSize: 14,
    color: '#64748B',
  },
  leadDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  notesText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  formScrollView: {
    flex: 1,
  },
  formContent: {
    padding: 24,
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#cdcecf',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notesInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalFooterSpacer: {
    height: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 70 : 70, // Extra padding for Android navigation bar
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
  },


  // Drag handle
  dragHandleWrapper: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },

  // Row (side by side)
  row: {
    flexDirection: 'row',
    marginBottom: 14,
  },

  // Field
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    height: '85%',
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    overflow: 'hidden',
  },

  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  errorText: {
    color: '#DC2626',
  },
  multilineInput: {
    minHeight: 50,
    maxHeight: 120,
    paddingTop: 10,
  },
  phoneText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
});