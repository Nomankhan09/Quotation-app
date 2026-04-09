import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { router, useLocalSearchParams } from 'expo-router';
import { setPaymentTerms, addCustomPaymentTerm, loadAllPaymentTerms, deleteOnePaymentTerm, } from '@/store/slices/quotationBuilderSlice';
import { saveQuotation, editQuotation } from '@/store/slices/quotationsSlice';
import { resetBuilder } from '@/store/slices/quotationBuilderSlice';
import { ArrowLeft, CreditCard, Plus, X, Check, Trash2 } from 'lucide-react-native';
import { handleBackPress } from '@/utils/navigation';

export default function PaymentTermsScreen() {
  const { 
    paymentTerms, 
    selectedPaymentTerms, 
    selectedLead, 
    selectedProducts, 
    discount, 
    selectedTerms,
    paymentTermsInitialized,
    loading 
  } = useSelector((state: RootState) => state.quotationBuilder);
  const { leads } = useSelector((state: RootState) => state.leads);
  const { products } = useSelector((state: RootState) => state.products);
  const { terms } = useSelector((state: RootState) => state.quotationBuilder);
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch<AppDispatch>();
  
  const params = useLocalSearchParams();
  const editMode = params.editMode === 'true';
  const quotationId = params.quotationId as string;
  const prefillData = params.prefillData ? JSON.parse(params.prefillData as string) : null;
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPaymentTerm, setNewPaymentTerm] = useState({
    description: '',
    value: '',
  });
  const [saving, setSaving] = useState(false);
  const [addingPaymentTerm, setAddingPaymentTerm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentTermToDelete, setPaymentTermToDelete] = useState<string | null>(null);
  const [deletingPaymentTerm, setDeletingPaymentTerm] = useState(false);
  
  const hasPrefilled = useRef(false);
  const hasLoadedPaymentTerms = useRef(false);

  // useEffect(() => {
  //   // Set current step when component mounts
  //   dispatch(setCurrentStep('payment-terms'));
  // }, [dispatch]);

  useEffect(() => {
    // Load payment terms from API if not already loaded
    if (token && !paymentTermsInitialized && !hasLoadedPaymentTerms.current) {
      dispatch(loadAllPaymentTerms());
      hasLoadedPaymentTerms.current = true;
    }
  }, [token, paymentTermsInitialized, dispatch]);

  useEffect(() => {
    // Pre-fill payment terms if in edit mode (run only once)
    if (editMode && prefillData && prefillData.paymentTerms && !hasPrefilled.current) {
      // Find payment term IDs that match the prefill payment terms
      const matchingPaymentTermIds = prefillData.paymentTerms
        .map((pt: any) => paymentTerms.find(p => p.description === pt.description && p.value === pt.value)?.id)
        .filter(Boolean);
      
      if (matchingPaymentTermIds.length > 0) {
        dispatch(setPaymentTerms(matchingPaymentTermIds));
      }
      hasPrefilled.current = true;
    }
  }, [editMode, prefillData, paymentTerms, dispatch]);

  const togglePaymentTerm = (termId: string) => {
    const updatedTerms = selectedPaymentTerms.includes(termId)
      ? selectedPaymentTerms.filter(id => id !== termId)
      : [...selectedPaymentTerms, termId];
    
    dispatch(setPaymentTerms(updatedTerms));
  };

  const handleAddPaymentTerm = async () => {
    if (!newPaymentTerm.description.trim() || !newPaymentTerm.value.trim()) {
      Alert.alert('Error', 'Please fill in both description and value');
      return;
    }

    try {
      setAddingPaymentTerm(true);
      await dispatch(addCustomPaymentTerm(newPaymentTerm)).unwrap();
      setNewPaymentTerm({ description: '', value: '' });
      setShowAddModal(false);
      Alert.alert('Success', 'Payment term added successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add payment term');
    } finally {
      setAddingPaymentTerm(false);
    }
  };

  const handleDeletePaymentTerm = async () => {
    if (!paymentTermToDelete) return;

    try {
      setDeletingPaymentTerm(true);
      await dispatch(deleteOnePaymentTerm(paymentTermToDelete)).unwrap();
      setShowDeleteModal(false);
      setPaymentTermToDelete(null);
      Alert.alert('Success', 'Payment term deleted successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete payment term');
    } finally {
      setDeletingPaymentTerm(false);
    }
  };

  const confirmDelete = (paymentTermId: string) => {
    setPaymentTermToDelete(paymentTermId);
    setShowDeleteModal(true);
  };

  const handleSaveQuotation = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!selectedLead) {
        Alert.alert('Error', 'Please select a lead');
        setSaving(false);
        return;
      }

      if (selectedProducts.length === 0) {
        Alert.alert('Error', 'Please add at least one product');
        setSaving(false);
        return;
      }

      // Calculate subtotal
      const subtotal = selectedProducts.reduce((sum, product) => {
        const price = typeof product.totalPrice === "string"
          ? parseFloat(product.totalPrice)
          : product.totalPrice;
        return sum + (price || 0);
      }, 0);

      // Calculate discount amount
      const discountAmount =
        discount.type === "percentage"
          ? (subtotal * discount.value) / 100
          : discount.value;

      const finalTotal = Math.max(0, subtotal - discountAmount);

      // Get selected terms as array of texts
      const selectedTermsText = selectedTerms
        .map(termId => terms.find(t => t.id === termId)?.text)
        .filter(Boolean);

      // Get selected payment terms as array of objects
      const selectedPaymentTermsData = selectedPaymentTerms
        .map(termId => {
          const pt = paymentTerms.find(p => p.id === termId);
          return pt
            ? {
                id: pt.id,
                description: pt.description,
                value: pt.value,
              }
            : null;
        })
        .filter(Boolean);

      // Format products array properly
      const formattedProducts = selectedProducts.map(product => ({
        productId: product.productId,
        unitPrice: product.unitPrice,
        quantity: product.quantity,
        length: product.length,
        width: product.width,
        unit: product.unit,
        totalPrice: product.totalPrice,
      }));

      // Final quotation object
      const quotationData = {
        leadId: selectedLead,
        products: formattedProducts,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: {
          type: discount.type,
          value: parseFloat(discount.value.toString()),
        },
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        totalAmount: parseFloat(finalTotal.toFixed(2)),
        terms: selectedTermsText,
        paymentTerms: selectedPaymentTermsData,
        status: "sent",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      let result;
      if (editMode && quotationId) {
        result = await dispatch(editQuotation({ 
          id: Number(quotationId), 
          quotationData 
        })).unwrap();
      } else {
        result = await dispatch(saveQuotation(quotationData)).unwrap();
      }
      
      // Reset builder state
      dispatch(resetBuilder({ force: true }));
      
      Alert.alert(
        "Success", 
        editMode ? "Quotation updated successfully!" : "Quotation created successfully!", 
        [
          { 
            text: "OK", 
            onPress: () => router.replace("/(tabs)/quotations") 
          },
        ]
      );
    } catch (error: any) {      
      
      // More detailed error handling
      let errorMessage = "Failed to save quotation";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.status) {
        errorMessage = `Server error: ${error.status}`;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !paymentTermsInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => handleBackPress('/(tabs)/quotations/terms')}
          >
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {editMode ? 'Edit Payment Terms' : 'Payment Terms'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading payment terms...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => handleBackPress('/quotation/create/terms')}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {editMode ? 'Edit Payment Terms' : 'Payment Terms'}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#3B82F6" />
        </TouchableOpacity>
        <View/>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.subtitle}>Select payment terms for your quotation:</Text>

        {paymentTerms.map((term) => (
          <View key={term.id} style={styles.termCardContainer}>
            <TouchableOpacity
              style={[styles.termCard, selectedPaymentTerms.includes(term.id) && styles.selectedTermCard]}
              onPress={() => togglePaymentTerm(term.id)}
            >
              <View style={styles.termContent}>
                <CreditCard size={16} color={selectedPaymentTerms.includes(term.id) ? '#3B82F6' : '#64748B'} />
                <View style={styles.termInfo}>
                  <Text style={[styles.termDescription, selectedPaymentTerms.includes(term.id) && styles.selectedTermText]}>
                    {term.description}%
                  </Text>
                  <Text style={styles.termValue}>{term.value}</Text>
                </View>
              </View>
              {selectedPaymentTerms.includes(term.id) && (
                <View style={styles.checkmark}>
                  <Check size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
            {/* Delete button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmDelete(term.id)}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            {selectedPaymentTerms.length} payment term{selectedPaymentTerms.length !== 1 ? 's' : ''} selected
          </Text>
        </View>

        {/* Spacer for footer */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveQuotation}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {editMode ? 'Update Quotation' : 'Save Quotation'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.deleteModalContainer}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Payment Term</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete this payment term? This action cannot be undone.
            </Text>
            
            <View style={styles.deleteModalFooter}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setPaymentTermToDelete(null);
                }}
                disabled={deletingPaymentTerm}
              >
                <Text style={styles.deleteCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmButton, deletingPaymentTerm && styles.deleteConfirmButtonDisabled]}
                onPress={handleDeletePaymentTerm}
                disabled={deletingPaymentTerm}
              >
                {deletingPaymentTerm ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Payment Term Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Payment Term</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Value</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 7"
                value={newPaymentTerm.description}
                onChangeText={(text) => setNewPaymentTerm({ ...newPaymentTerm, description: text })}
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Advance Booking Amount..."
                value={newPaymentTerm.value}
                onChangeText={(text) => setNewPaymentTerm({ ...newPaymentTerm, value: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
              disabled={addingPaymentTerm}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addTermButton, addingPaymentTerm && styles.addTermButtonDisabled]}
              onPress={handleAddPaymentTerm}
              disabled={addingPaymentTerm}
            >
              {addingPaymentTerm ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.addTermButtonText}>Add Term</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'relative',
    right: -30
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100, // Increased padding for Android
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  termCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTermCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  termContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  termInfo: {
    flex: 1,
  },
  termDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  selectedTermText: {
    color: '#1E293B',
    fontWeight: '600',
  },
  termValue: {
    fontSize: 12,
    color: '#64748B',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCount: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  footerSpacer: {
    height: 80,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 70, // Extra padding for Android navigation bar
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
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
  modalContent: {
    padding: 24,
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
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
  addTermButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addTermButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addTermButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  termCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '90%',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 12,
  },
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 24,
  },
  deleteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  deleteCancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteConfirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});