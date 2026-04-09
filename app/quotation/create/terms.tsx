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
import { setTerms, addCustomTerm, loadAllTerms, deleteOneTerm, setCurrentStep } from '@/store/slices/quotationBuilderSlice';
// import { ArrowLeft, FileText, Plus, X, Check, Trash2 } from 'lucide-react-native';
import { handleBackPress } from '@/utils/navigation';

export default function TermsScreen() {
  const { terms, selectedTerms, termsInitialized, loading } = useSelector((state: RootState) => state.quotationBuilder);
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch<AppDispatch>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [addingTerm, setAddingTerm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [termToDelete, setTermToDelete] = useState<string | null>(null);
  const [deletingTerm, setDeletingTerm] = useState(false);
  const params = useLocalSearchParams();
  const editMode = params.editMode === 'true';
  const prefillData = params.prefillData ? JSON.parse(params.prefillData as string) : null;
  
  const hasPrefilled = useRef(false);
  const hasLoadedTerms = useRef(false);

  useEffect(() => {
    // Set current step when component mounts
    dispatch(setCurrentStep('terms'));
  }, [dispatch]);

  useEffect(() => {
    // Load terms from API if not already loaded
    if (token && !termsInitialized && !hasLoadedTerms.current) {
      dispatch(loadAllTerms());
      hasLoadedTerms.current = true;
    }
  }, [token, termsInitialized, dispatch]);

  useEffect(() => {
    // Pre-fill selected terms if in edit mode (run only once)
    if (editMode && prefillData && prefillData.terms && !hasPrefilled.current) {
      // Find term IDs that match the prefill terms
      const matchingTermIds = prefillData.terms
        .map((termText: string) => terms.find(t => t.text === termText)?.id)
        .filter(Boolean);
      
      if (matchingTermIds.length > 0) {
        dispatch(setTerms(matchingTermIds));
      }
      hasPrefilled.current = true;
    }
  }, [editMode, prefillData, terms, dispatch]);

  const toggleTerm = (termId: string) => {
    const updatedTerms = selectedTerms.includes(termId)
      ? selectedTerms.filter(id => id !== termId)
      : [...selectedTerms, termId];
    
    dispatch(setTerms(updatedTerms));
  };

  const handleAddTerm = async () => {
    if (!newTerm.trim()) {
      Alert.alert('Error', 'Please enter a term');
      return;
    }

    try {
      setAddingTerm(true);
      await dispatch(addCustomTerm(newTerm.trim())).unwrap();
      setNewTerm('');
      setShowAddModal(false);
      Alert.alert('Success', 'Term added successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add term');
    } finally {
      setAddingTerm(false);
    }
  };

  const handleDeleteTerm = async () => {
    if (!termToDelete) return;

    try {
      setDeletingTerm(true);
      await dispatch(deleteOneTerm(termToDelete)).unwrap();
      setShowDeleteModal(false);
      setTermToDelete(null);
      Alert.alert('Success', 'Term deleted successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete term');
    } finally {
      setDeletingTerm(false);
    }
  };

  const confirmDelete = (termId: string) => {
    setTermToDelete(termId);
    setShowDeleteModal(true);
  };

  const handleContinue = () => {
    router.push({
      pathname: '/quotation/create/payment-terms',
      params: { 
        editMode: editMode ? 'true' : 'false',
        quotationId: params.quotationId,
        prefillData: params.prefillData
      }
    });
  };

  if (loading && !termsInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => handleBackPress('/(tabs)/quotations/discount')}
          >
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {editMode ? 'Edit Terms & Conditions' : 'Terms & Conditions'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading terms...</Text>
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
          onPress={() => handleBackPress('/quotation/create/discount')}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {editMode ? 'Edit Terms & Conditions' : 'Terms & Conditions'}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.subtitle}>Select terms to include in your quotation:</Text>

        {terms.map((term) => (
          <View key={term.id} style={styles.termCardContainer}>
            <TouchableOpacity
              style={[styles.termCard, selectedTerms.includes(term.id) && styles.selectedTermCard]}
              onPress={() => toggleTerm(term.id)}
            >
              <View style={styles.termContent}>
                <FileText size={16} color={selectedTerms.includes(term.id) ? '#3B82F6' : '#64748B'} />
                <Text style={[styles.termText, selectedTerms.includes(term.id) && styles.selectedTermText]}>
                  {term.text}
                </Text>
              </View>
              {selectedTerms.includes(term.id) && (
                <View style={styles.checkmark}>
                  <Check size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
            {/* Delete button - only show for custom terms (you might want to add a isCustom flag to your Term type) */}
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
            {selectedTerms.length} term{selectedTerms.length !== 1 ? 's' : ''} selected
          </Text>
        </View>

        {/* Spacer for footer */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            {editMode ? 'Continue to Edit Payment Terms' : 'Continue to Payment Terms'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.deleteModalContainer}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Term</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete this term? This action cannot be undone.
            </Text>
            
            <View style={styles.deleteModalFooter}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setTermToDelete(null);
                }}
                disabled={deletingTerm}
              >
                <Text style={styles.deleteCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmButton, deletingTerm && styles.deleteConfirmButtonDisabled]}
                onPress={handleDeleteTerm}
                disabled={deletingTerm}
              >
                {deletingTerm ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Term Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Custom Term</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.termInput}
              placeholder="Enter custom term..."
              value={newTerm}
              onChangeText={setNewTerm}
              multiline
              numberOfLines={4}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
              disabled={addingTerm}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, addingTerm && styles.saveButtonDisabled]}
              onPress={handleAddTerm}
              disabled={addingTerm}
            >
              {addingTerm ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Add Term</Text>
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
    alignItems: 'center',
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
    alignItems: 'flex-start',
    gap: 12,
  },
  termText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  selectedTermText: {
    color: '#1E293B',
    fontWeight: '500',
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
  continueButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
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
  },
  termInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlignVertical: 'top',
    minHeight: 120,
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
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
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
  // Delete Modal Styles
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