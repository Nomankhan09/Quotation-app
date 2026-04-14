import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
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
  Building,
  User,
  X,
} from 'lucide-react-native';
import { Lead, addLead } from '@/store/slices/leadsSlice';

export default function LeadsScreen() {
  const dispatch = useDispatch<any>();
  const { leads, search } = useSelector(
    (state: RootState) => state.leads
  );

  const [searchQuery, setSearchQuery] = useState(search);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    notes: '',
  });

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

  const handleAddLead = () => {
    if (!newLead.full_name || !newLead.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!newLead.email) {
      newLead.email = "NA"
    }

    dispatch(addLead(newLead));
    setNewLead({
      full_name: '',
      email: '',
      phone: '',
      company_name: '',
      notes: '',
    });
    setShowAddModal(false);
    Alert.alert('Success', 'Contact added successfully!');
  };

  const renderLeadItem = ({ item }: { item: Lead }) => (
    <TouchableOpacity style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          <Text style={styles.leadName}>{item.full_name}</Text>
          <Text style={styles.leadCompany}>{item.company_name}</Text>
        </View>
      </View>

      <View style={styles.leadDetails}>
        <View style={styles.detailRow}>
          <Mail size={16} color="#64748B" />
          <Text style={styles.detailText}>{item.email}</Text>
        </View>
        {item.phone && (
          <View style={styles.detailRow}>
            <Phone size={16} color="#64748B" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        {item.notes && (
          <Text style={styles.notesText}>{item.notes}</Text>
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
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Contact</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Scrollable form content */}
          <ScrollView
            style={styles.formScrollView}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inputContainer}>
              <User size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                value={newLead.full_name}
                onChangeText={(text) => setNewLead({ ...newLead, full_name: text })}
                placeholderTextColor="#94A3B8"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                value={newLead.phone}
                onChangeText={(text) => setNewLead({ ...newLead, phone: text })}
                keyboardType="phone-pad"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputContainer}>
              <Building size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Company"
                value={newLead.company_name}
                onChangeText={(text) => setNewLead({ ...newLead, company_name: text })}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={newLead.email}
                onChangeText={(text) => setNewLead({ ...newLead, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Notes (optional)"
                value={newLead.notes}
                onChangeText={(text) => setNewLead({ ...newLead, notes: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor="#94A3B8"
                returnKeyType="done"
              />
            </View>

            {/* Spacer for modal footer */}
            <View style={styles.modalFooterSpacer} />
          </ScrollView>

          {/* Fixed footer buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddLead}
            >
              <Text style={styles.saveButtonText}>Add Contact</Text>
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
    marginHorizontal: 24,
    marginVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 24,
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
});