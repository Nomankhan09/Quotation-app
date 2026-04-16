// Due to the large size of this file, I'll provide the enhanced version in multiple parts
// This is Part 1: Imports and Component Setup

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
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  User,
  Package,
  Percent,
  IndianRupee,
  FileText,
  CreditCard,
  Plus,
  X,
  Check,
  Search,
  Trash2,
  ChevronDown,
  Calendar,
  Edit,
  Minus,
  Building,
  Mail,
  Phone,
  Tag,
  SlidersHorizontal,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  setSelectedLead,
  setSelectedProducts,
  updateProductConfig,
  setDiscount,
  setTerms,
  setPaymentTerms,
  resetBuilder,
  SelectedProduct,
  setSpecifications,
  addSpecification,
} from '@/store/slices/quotationBuilderSlice';
import { saveQuotation, editQuotation } from '@/store/slices/quotationsSlice';
import { addLead } from '@/store/slices/leadsSlice';
import { addProduct } from '@/store/slices/productsSlice';
import { addCategory } from '@/store/slices/categoriesSlice';
import {
  loadAllTerms,
  addCustomTerm,
  loadAllPaymentTerms,
  addCustomPaymentTerm
} from '@/store/slices/quotationBuilderSlice';
import { createSpecification } from '@/services/specificationsService';

export default function CreateQuotationCompactScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();
  const editMode = params.editMode === 'true';
  const quotationId = params.quotationId as string;
  const prefillData = params.prefillData ? JSON.parse(params.prefillData as string) : null;

  // Redux selectors
  const { leads } = useSelector((state: RootState) => state.leads);
  const { products } = useSelector((state: RootState) => state.products);
  const { categories } = useSelector((state: RootState) => state.categories);
  const {
    selectedLead,
    selectedProducts,
    discount,
    terms,
    selectedTerms,
    paymentTerms,
    selectedPaymentTerms,
    selectedSpecifications,
    allSpecifications,
  } = useSelector((state: RootState) => state.quotationBuilder);
  const token = useSelector((state: RootState) => state.auth.token);

  // State
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [showPaymentTermModal, setShowPaymentTermModal] = useState(false);
  const [showSpecificationModal, setShowSpecificationModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Discount state
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(discount.type);
  const [discountValue, setDiscountValue] = useState(discount.value.toString());

  // Term state
  const [newTerm, setNewTerm] = useState('');
  const [newPaymentTerm, setNewPaymentTerm] = useState({
    description: '',
    value: '',
  });

  // Specification state
  const [newSpecification, setNewSpecification] = useState({
    item: '',
    description: [''], // 👈 array instead of single string
  });

  const addDescriptionField = () => {
    setNewSpecification(prev => ({
      ...prev,
      description: [...prev.description, ''],
    }));
  };

  const updateDescription = (text: string, index: number) => {
    const updated = [...newSpecification.description];
    updated[index] = text;

    setNewSpecification(prev => ({
      ...prev,
      description: updated,
    }));
  };

  const removeDescription = (index: number) => {
    const updated = newSpecification.description.filter((_, i) => i !== index);

    setNewSpecification(prev => ({
      ...prev,
      description: updated.length ? updated : [''],
    }));
  };

  // Quotation details
  const [quotationDetails, setQuotationDetails] = useState({
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    notes: '',
  });

  const hasPrefilled = useRef(false);

  // Load terms on mount
  useEffect(() => {
    if (token) {
      dispatch(loadAllTerms());
      dispatch(loadAllPaymentTerms());
    }
  }, [token, dispatch]);

  const {
    termsInitialized,
    paymentTermsInitialized,
  } = useSelector((state: RootState) => state.quotationBuilder);

  useEffect(() => {
    if (
      !editMode &&
      termsInitialized &&
      paymentTermsInitialized &&
      !hasPrefilled.current
    ) {
      // dispatch(setTerms(selectedTerms));
      // dispatch(setPaymentTerms(selectedPaymentTerms));
      dispatch(setSpecifications(selectedSpecifications));

      hasPrefilled.current = true;
    }
  }, [
    termsInitialized,
    paymentTermsInitialized,
    selectedTerms,
    selectedPaymentTerms,
    selectedSpecifications,
    editMode,
  ]);

  // Helper functions
  const getSelectedClient = () => leads.find(lead => lead.id === selectedLead);

  const getSubtotal = () => {
    return selectedProducts.reduce((sum, product) => {
      const price = typeof product.totalPrice === 'string'
        ? parseFloat(product.totalPrice)
        : product.totalPrice;
      return sum + (price || 0);
    }, 0);
  };

  const handleAddSpecification = async () => {
    if (!newSpecification.item) return;

    try {
      const payload = {
        item: newSpecification.item,
        description: newSpecification.description
          .filter(d => d.trim() !== '')
          .map(d => ({ description: d })),
      };

      // 1️⃣ SAVE IN DB
      const res = await createSpecification(payload, token as string);

      const savedSpec = res; // assuming API returns created record
      // 2️⃣ ADD TO LIST
      dispatch(addSpecification(savedSpec));
      // (you must create this reducer)

      // 3️⃣ AUTO SELECT NEW ITEM
      dispatch(setSpecifications([
        ...selectedSpecifications,
        savedSpec.id
      ]));

      // reset form
      setNewSpecification({
        item: '',
        description: [''],
      });

    } catch (error) {
      console.log('Add specification error:', error);
    }
  };

  const getDiscountAmount = () => {
    const subtotal = getSubtotal();
    const value = parseFloat(discountValue) || 0;
    return discountType === 'percentage' ? (subtotal * value) / 100 : value;
  };

  const getFinalTotal = () => getSubtotal() - getDiscountAmount();

  // Handlers
  const handleSelectClient = (leadId: string) => {
    dispatch(setSelectedLead(leadId));
    setShowClientModal(false);
  };

  const handleSelectProduct = (productId: string) => {
    const isSelected = selectedProducts.some(p => p.productId === productId);

    if (isSelected) {
      const updatedProducts = selectedProducts.filter(p => p.productId !== productId);
      dispatch(setSelectedProducts(updatedProducts));
    } else {
      const product = products.find(p => p.id === productId);
      if (product) {
        const newSelectedProduct: SelectedProduct = {
          productId: productId,
          unitPrice: product.unit_price,
          length: 1,
          width: 1,
          quantity: 1,
          unit: 'feet',
          totalPrice: product.unit_price,
          product_name: product.product_name,
          categoryId: String(product.category_id),
          categoryName: categories.find(c => c.id === product.category_id)?.category_name || ''
        };
        dispatch(setSelectedProducts([...selectedProducts, newSelectedProduct]));
      }
    }
  };

  const handleUpdateProduct = (productId: string, field: string, value: any) => {
    const updatedProducts = selectedProducts.map(p => {
      if (p.productId === productId) {
        const updated = { ...p, [field]: value };
        let length = updated.length;
        let width = updated.width;

        if (updated.unit === 'inches') {
          length = length / 12;
          width = width / 12;
        }

        updated.totalPrice = updated.unitPrice * length * width * updated.quantity;
        return updated;
      }
      return p;
    });

    dispatch(updateProductConfig(updatedProducts));
  };

  const changeQty = (productId: string, by: number) => {
    const product = selectedProducts.find(p => p.productId === productId);
    if (product) {
      const newQty = Math.max(1, product.quantity + by);
      handleUpdateProduct(productId, 'quantity', newQty);
    }
  };

  const changeLength = (productId: string, by: number) => {
    const product = selectedProducts.find(p => p.productId === productId);
    if (product) {
      const newLength = Math.max(0, Math.round((product.length + by) * 100) / 100);
      handleUpdateProduct(productId, 'length', newLength);
    }
  };

  const changeWidth = (productId: string, by: number) => {
    const product = selectedProducts.find(p => p.productId === productId);
    if (product) {
      const newWidth = Math.max(0, Math.round((product.width + by) * 100) / 100);
      handleUpdateProduct(productId, 'width', newWidth);
    }
  };

  const handleToggleTerm = (termId: string) => {
    const updatedTerms = selectedTerms.includes(termId)
      ? selectedTerms.filter(id => id !== termId)
      : [...selectedTerms, termId];
    dispatch(setTerms(updatedTerms));
  };

  const handleTogglePaymentTerm = (termId: string) => {
    const updatedTerms = selectedPaymentTerms.includes(termId)
      ? selectedPaymentTerms.filter(id => id !== termId)
      : [...selectedPaymentTerms, termId];
    dispatch(setPaymentTerms(updatedTerms));
  };
  const toggleSpecification = (id: string) => {
    const stringId = String(id); // ✅ FIX

    const updatedSpecifications = selectedSpecifications.includes(stringId)
      ? selectedSpecifications.filter(sid => sid !== stringId)
      : [...selectedSpecifications, stringId];

    dispatch(setSpecifications(updatedSpecifications));
  };

  const handleAddTerm = async () => {
    if (!newTerm.trim()) {
      Alert.alert('Error', 'Please enter a term');
      return;
    }

    try {
      await dispatch(addCustomTerm(newTerm.trim())).unwrap();
      setNewTerm('');
      Alert.alert('Success', 'Term added!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add term');
    }
  };

  const handleAddPaymentTerm = async () => {
    if (!newPaymentTerm.description.trim() || !newPaymentTerm.value.trim()) {
      Alert.alert('Error', 'Please fill in both fields');
      return;
    }

    try {
      await dispatch(addCustomPaymentTerm(newPaymentTerm)).unwrap();
      setNewPaymentTerm({ description: '', value: '' });
      Alert.alert('Success', 'Payment term added!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add payment term');
    }
  };

  const handleSaveQuotation = async () => {
    try {
      setSaving(true);

      if (!selectedLead || selectedProducts.length === 0) {
        Alert.alert('Error', 'Please select client and add products');
        setSaving(false);
        return;
      }

      dispatch(setDiscount({
        type: discountType,
        value: parseFloat(discountValue) || 0,
      }));

      const quotationData = {
        leadId: selectedLead,
        products: selectedProducts,
        subtotal: parseFloat(getSubtotal().toFixed(2)),
        discount: {
          type: discountType,
          value: parseFloat(discountValue),
        },
        discountAmount: parseFloat(getDiscountAmount().toFixed(2)),
        totalAmount: parseFloat(getFinalTotal().toFixed(2)),
        terms: selectedTerms.map(id => terms.find(t => t.id === id)?.text).filter(Boolean),
        paymentTerms: selectedPaymentTerms.map(id => {
          const pt = paymentTerms.find(p => p.id === id);
          return pt ? { id: pt.id, description: pt.description, value: pt.value } : null;
        }).filter(Boolean),
        specifications: selectedSpecifications,
        status: "sent",
        validUntil: quotationDetails.validUntil.toISOString(),
        notes: quotationDetails.notes,
      };

      if (editMode && quotationId) {
        await dispatch(editQuotation({ id: Number(quotationId), quotationData })).unwrap();
      } else {
        await dispatch(saveQuotation(quotationData)).unwrap();
      }

      dispatch(resetBuilder({ force: true }));

      Alert.alert(
        "Success",
        editMode ? "Updated!" : "Created!",
        [{ text: "OK", onPress: () => router.replace("/(tabs)/quotations") }]
      );
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // This file continues in the next artifact due to size...
  // I'll provide the render methods and styles in the complete artifact

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {editMode ? 'Edit Quotation' : 'Create Quotation'}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Client Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrapper}>
              <User size={20} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>Client</Text>
          </View>

          {getSelectedClient() ? (
            <TouchableOpacity
              style={styles.selectedCard}
              onPress={() => setShowClientModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.clientDetails}>
                <View style={styles.clientRow}>
                  <User size={16} color="#64748B" />
                  <Text style={styles.clientText}>{getSelectedClient()?.full_name}</Text>
                </View>
                <View style={styles.clientRow}>
                  <Building size={16} color="#64748B" />
                  <Text style={styles.clientText}>{getSelectedClient()?.company_name}</Text>
                </View>
                <View style={styles.clientRow}>
                  <Mail size={16} color="#64748B" />
                  <Text style={styles.clientText}>{getSelectedClient()?.email}</Text>
                </View>
              </View>
              <Edit size={18} color="#3B82F6" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addCard}
              onPress={() => setShowClientModal(true)}
              activeOpacity={0.7}
            >
              <Plus size={20} color="#3B82F6" />
              <Text style={styles.addCardText}>Select Client</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Products Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrapper, { backgroundColor: '#FEF3C7' }]}>
              <Package size={20} color="#F59E0B" />
            </View>
            <Text style={styles.cardTitle}>Items ({selectedProducts.length})</Text>
            <TouchableOpacity
              style={styles.addIconButton}
              onPress={() => setShowProductModal(true)}
              activeOpacity={0.7}
            >
              <Plus size={18} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {selectedProducts.length === 0 ? (
            <TouchableOpacity
              style={styles.addCard}
              onPress={() => setShowProductModal(true)}
              activeOpacity={0.7}
            >
              <Plus size={20} color="#3B82F6" />
              <Text style={styles.addCardText}>Add Items</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.productsContainer}>
              {selectedProducts.map((item, index) => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;

                return (
                  <View key={`${item.productId} - ${index}`} style={styles.productCard}>
                    <View style={styles.productCardHeader}>
                      <Text style={styles.productName}>{product.product_name}</Text>
                      <TouchableOpacity
                        onPress={() => handleSelectProduct(item.productId)}
                        activeOpacity={0.7}
                      >
                        <X size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Price and Quantity Row */}
                    <View style={styles.configRow}>
                      <View style={styles.configField}>
                        <Text style={styles.configLabel}>Price</Text>
                        <View style={styles.priceInput}>
                          <IndianRupee size={14} color="#64748B" />
                          <TextInput
                            style={styles.priceInputField}
                            value={item.unitPrice.toString()}
                            onChangeText={(t) => handleUpdateProduct(item.productId, 'unitPrice', parseFloat(t) || 0)}
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>

                      <View style={styles.configField}>
                        <Text style={styles.configLabel}>Quantity</Text>
                        <View style={styles.counterBox}>
                          <TouchableOpacity
                            style={styles.counterButton}
                            onPress={() => changeQty(item.productId, -1)}
                            activeOpacity={0.7}
                          >
                            <Minus size={14} color="#64748B" />
                          </TouchableOpacity>
                          <TextInput
                            style={styles.counterInput}
                            value={item.quantity.toString()}
                            onChangeText={(t) => handleUpdateProduct(item.productId, 'quantity', parseInt(t) || 1)}
                            keyboardType="number-pad"
                          />
                          <TouchableOpacity
                            style={styles.counterButton}
                            onPress={() => changeQty(item.productId, 1)}
                            activeOpacity={0.7}
                          >
                            <Plus size={14} color="#64748B" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Dimensions Row */}
                    <View style={styles.configRow}>
                      <View style={styles.configField}>
                        <Text style={styles.configLabel}>Length</Text>
                        <View style={styles.counterBox}>
                          <TouchableOpacity
                            style={styles.counterButton}
                            onPress={() => changeLength(item.productId, -0.1)}
                            activeOpacity={0.7}
                          >
                            <Minus size={14} color="#64748B" />
                          </TouchableOpacity>
                          <TextInput
                            style={styles.counterInput}
                            value={item.length.toString()}
                            onChangeText={(t) => handleUpdateProduct(item.productId, 'length', parseFloat(t) || 0)}
                            keyboardType="decimal-pad"
                          />
                          <TouchableOpacity
                            style={styles.counterButton}
                            onPress={() => changeLength(item.productId, 0.1)}
                            activeOpacity={0.7}
                          >
                            <Plus size={14} color="#64748B" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text style={styles.multiplySymbol}>×</Text>

                      <View style={styles.configField}>
                        <Text style={styles.configLabel}>Width</Text>
                        <View style={styles.counterBox}>
                          <TouchableOpacity
                            style={styles.counterButton}
                            onPress={() => changeWidth(item.productId, -0.1)}
                            activeOpacity={0.7}
                          >
                            <Minus size={14} color="#64748B" />
                          </TouchableOpacity>
                          <TextInput
                            style={styles.counterInput}
                            value={item.width.toString()}
                            onChangeText={(t) => handleUpdateProduct(item.productId, 'width', parseFloat(t) || 0)}
                            keyboardType="decimal-pad"
                          />
                          <TouchableOpacity
                            style={styles.counterButton}
                            onPress={() => changeWidth(item.productId, 0.1)}
                            activeOpacity={0.7}
                          >
                            <Plus size={14} color="#64748B" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Total Display */}
                    <View style={styles.productTotal}>
                      <Text style={styles.productTotalLabel}>Item Total</Text>
                      <Text style={styles.productTotalValue}>
                        ₹{typeof item.totalPrice === 'number' ? item.totalPrice.toFixed(2) : parseFloat(item.totalPrice).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Discount Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrapper, { backgroundColor: '#EDE9FE' }]}>
              <Percent size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.cardTitle}>Discount</Text>
          </View>

          <View style={styles.discountRow}>
            <View style={styles.discountToggle}>
              <TouchableOpacity
                style={[styles.discountTypeBtn, discountType === 'percentage' && styles.discountTypeBtnActive]}
                onPress={() => setDiscountType('percentage')}
                activeOpacity={0.7}
              >
                <Percent size={16} color={discountType === 'percentage' ? '#fff' : '#64748B'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.discountTypeBtn, discountType === 'fixed' && styles.discountTypeBtnActive]}
                onPress={() => setDiscountType('fixed')}
                activeOpacity={0.7}
              >
                <IndianRupee size={16} color={discountType === 'fixed' ? '#fff' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.discountInput}
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#CBD5E1"
            />
          </View>

          {parseFloat(discountValue) > 0 && (
            <View style={styles.discountPreview}>
              <Text style={styles.discountPreviewLabel}>Discount Amount</Text>
              <Text style={styles.discountPreviewValue}>-₹{getDiscountAmount().toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Terms Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrapper, { backgroundColor: '#FEE2E2' }]}>
              <FileText size={20} color="#EF4444" />
            </View>
            <Text style={styles.cardTitle}>Terms & Conditions</Text>
            <TouchableOpacity
              style={styles.addIconButton}
              onPress={() => setShowTermModal(true)}
              activeOpacity={0.7}
            >
              <Plus size={18} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <View style={styles.termsGrid}>
            {terms.slice(0, 3).map((term) => (
              <TouchableOpacity
                key={term.id}
                style={[styles.termChip, selectedTerms.includes(term.id) && styles.termChipActive]}
                onPress={() => handleToggleTerm(term.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.termCheckbox, selectedTerms.includes(term.id) && styles.termCheckboxActive]}>
                  {selectedTerms.includes(term.id) && <Check size={12} color="#fff" />}
                </View>
                <Text style={styles.termChipText} numberOfLines={2}>{term.text}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {terms.length > 3 && (
            <TouchableOpacity style={styles.viewAllButton} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View all terms ({terms.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Terms */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrapper, { backgroundColor: '#D1FAE5' }]}>
              <CreditCard size={20} color="#10B981" />
            </View>
            <Text style={styles.cardTitle}>Payment Terms</Text>
            <TouchableOpacity
              style={styles.addIconButton}
              onPress={() => setShowPaymentTermModal(true)}
              activeOpacity={0.7}
            >
              <Plus size={18} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <View style={styles.paymentTermsGrid}>
            {paymentTerms.slice(0, 6).map((term) => (
              <TouchableOpacity
                key={term.id}
                style={[styles.paymentTermChip, selectedPaymentTerms.includes(term.id) && styles.paymentTermChipActive]}
                onPress={() => handleTogglePaymentTerm(term.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.termCheckbox, selectedPaymentTerms.includes(term.id) && styles.termCheckboxActive]}>
                  {selectedPaymentTerms.includes(term.id) && <Check size={12} color="#fff" />}
                </View>
                <Text style={styles.paymentTermChipText}>{term.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Specifications */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrapper, { backgroundColor: '#e2d8f9' }]}>
              <SlidersHorizontal size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.cardTitle}>Specifications</Text>
            <TouchableOpacity
              style={styles.addIconButton}
              onPress={() => setShowSpecificationModal(true)}
              activeOpacity={0.7}
            >
              <Plus size={18} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <View style={styles.paymentTermsGrid}>
            {allSpecifications.slice(0, 6).map((term) => (
              <TouchableOpacity
                key={term.id}
                style={[
                  styles.paymentTermChip,
                  selectedSpecifications.includes(String(term.id)) &&
                  styles.paymentTermChipActive
                ]}
                onPress={() => toggleSpecification(term.id)} // ✅ FIXED
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.termCheckbox,
                    selectedSpecifications.includes(String(term.id)) &&
                    styles.termCheckboxActive
                  ]}
                >
                  {selectedSpecifications.includes(String(term.id)) && (
                    <Check size={12} color="#fff" />
                  )}
                </View>

                <Text style={styles.paymentTermChipText}>{term.item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quotation Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrapper, { backgroundColor: '#E0E7FF' }]}>
              <Calendar size={20} color="#6366F1" />
            </View>
            <Text style={styles.cardTitle}>Quotation Details</Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Valid Until</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Calendar size={16} color="#64748B" />
                <Text style={styles.dateButtonText}>{formatDate(quotationDetails.validUntil)}</Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesTextArea}
                placeholder="Add notes..."
                value={quotationDetails.notes}
                onChangeText={(text) => setQuotationDetails(prev => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={3}
                placeholderTextColor="#CBD5E1"
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{getSubtotal().toFixed(2)}</Text>
          </View>

          {parseFloat(discountValue) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>-₹{getDiscountAmount().toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRowFinal}>
            <Text style={styles.summaryLabelFinal}>Total Amount</Text>
            <Text style={styles.summaryValueFinal}>₹{getFinalTotal().toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveQuotation}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {editMode ? 'Update Quotation' : 'Create Quotation'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Client Modal */}
      <Modal
        visible={showClientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClientModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Client</Text>
            <TouchableOpacity onPress={() => setShowClientModal(false)} activeOpacity={0.7}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrapper}>
            <Search size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#CBD5E1"
            />
          </View>

          <FlatList
            data={leads.filter(lead =>
              lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              lead.company_name.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, selectedLead === item.id && styles.modalItemActive]}
                onPress={() => handleSelectClient(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.modalItemAvatar}>
                  <User size={20} color="#3B82F6" />
                </View>
                <View style={styles.modalItemContent}>
                  <Text style={styles.modalItemTitle}>{item.full_name}</Text>
                  <Text style={styles.modalItemSubtitle}>{item.company_name}</Text>
                </View>
                {selectedLead === item.id && (
                  <View style={styles.modalItemCheck}>
                    <Check size={16} color="#10B981" />
                  </View>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
          />
        </View>
      </Modal>

      {/* Product Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Products</Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)} activeOpacity={0.7}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrapper}>
            <Search size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#CBD5E1"
            />
          </View>

          <FlatList
            data={products.filter(product =>
              product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            renderItem={({ item }) => {
              const isSelected = selectedProducts.some(p => p.productId === item.id);
              const category = categories.find(c => c.id === item.category_id);

              return (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected && styles.modalItemActive]}
                  onPress={() => handleSelectProduct(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemContent}>
                    <View style={styles.productModalHeader}>
                      <Text style={styles.modalItemTitle}>{item.product_name}</Text>
                      <Text style={styles.productModalPrice}>₹{item.unit_price}</Text>
                    </View>
                    {category && (
                      <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                        <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                          {category.category_name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.productCheckbox, isSelected && styles.productCheckboxActive]}>
                    {isSelected && <Check size={16} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
          />
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal
        visible={showTermModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTermModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <TouchableOpacity onPress={() => setShowTermModal(false)} activeOpacity={0.7}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.addTermSection}>
            <TextInput
              style={styles.addTermInput}
              placeholder="Add new term..."
              value={newTerm}
              onChangeText={setNewTerm}
              placeholderTextColor="#CBD5E1"
            />
            <TouchableOpacity style={styles.addTermButton} onPress={handleAddTerm} activeOpacity={0.7}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={terms}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.termModalItem, selectedTerms.includes(item.id) && styles.termModalItemActive]}
                onPress={() => handleToggleTerm(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.termCheckbox, selectedTerms.includes(item.id) && styles.termCheckboxActive]}>
                  {selectedTerms.includes(item.id) && <Check size={14} color="#fff" />}
                </View>
                <Text style={styles.termModalText}>{item.text}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
          />
        </View>
      </Modal>

      {/* Payment Terms Modal */}
      <Modal
        visible={showPaymentTermModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentTermModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Terms</Text>
            <TouchableOpacity onPress={() => setShowPaymentTermModal(false)} activeOpacity={0.7}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.addPaymentTermSection}>
            <TextInput
              style={styles.addPaymentTermInput}
              placeholder="Description..."
              value={newPaymentTerm.description}
              onChangeText={(text) => setNewPaymentTerm(prev => ({ ...prev, description: text }))}
              placeholderTextColor="#CBD5E1"
            />
            <TextInput
              style={styles.addPaymentTermInputSmall}
              placeholder="Value..."
              value={newPaymentTerm.value}
              onChangeText={(text) => setNewPaymentTerm(prev => ({ ...prev, value: text }))}
              placeholderTextColor="#CBD5E1"
            />
            <TouchableOpacity style={styles.addTermButton} onPress={handleAddPaymentTerm} activeOpacity={0.7}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={paymentTerms}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.termModalItem, selectedPaymentTerms.includes(item.id) && styles.termModalItemActive]}
                onPress={() => handleTogglePaymentTerm(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.termCheckbox, selectedPaymentTerms.includes(item.id) && styles.termCheckboxActive]}>
                  {selectedPaymentTerms.includes(item.id) && <Check size={14} color="#fff" />}
                </View>
                <View style={styles.paymentTermModalContent}>
                  <Text style={styles.paymentTermModalTitle}>{item.description}</Text>
                  <Text style={styles.paymentTermModalValue}>{item.value}</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
          />
        </View>
      </Modal>

      {/* Specifications Modal */}
      <Modal
        visible={showSpecificationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSpecificationModal(false)}
      >
        <View style={styles.modalContainer}>

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Specifications</Text>
            <TouchableOpacity onPress={() => setShowSpecificationModal(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* CONTENT WRAPPER */}
          <ScrollView
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >

            {/* ADD SPEC CARD */}
            <View style={styles.specCard}>

              <Text style={styles.specLabel}>Title</Text>
              <TextInput
                style={styles.specInput}
                placeholder="Specification title..."
                value={newSpecification.item}
                onChangeText={(text) =>
                  setNewSpecification(prev => ({ ...prev, item: text }))
                }
              />

              <Text style={[styles.specLabel, { marginTop: 10 }]}>
                Description
              </Text>

              {newSpecification.description.map((desc, index) => (
                <View key={index} style={styles.specRow}>

                  <TextInput
                    style={styles.specInputSmall}
                    placeholder={`Description ${index + 1}`}
                    value={desc.description}
                    onChangeText={(text) => updateDescription(text, index)}
                  />

                  <TouchableOpacity onPress={() => removeDescription(index)}>
                    <X size={18} color="#EF4444" />
                  </TouchableOpacity>

                </View>
              ))}

              <TouchableOpacity onPress={addDescriptionField} style={styles.addDescriptionButton} activeOpacity={0.7}>
                <Text style={styles.addMoreText}>
                  + Add description
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleAddSpecification}
              >
                <Plus size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Add Specification</Text>
              </TouchableOpacity>

            </View>

            {/* LIST TITLE */}
            <Text style={styles.sectionTitle}>Saved Specifications</Text>

            {/* LIST */}
            <View style={styles.listContainer}>
              <FlatList
                data={allSpecifications}
                keyExtractor={(item) => String(item.id)}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.specItem,
                      selectedSpecifications.includes(String(item.id)) && styles.specItemActive
                    ]}
                    onPress={() => toggleSpecification(item.id)}
                  >
                    <View
                      style={[
                        styles.termCheckbox,
                        selectedSpecifications.includes(String(item.id)) && styles.termCheckboxActive
                      ]}
                    >
                      {selectedSpecifications.includes(String(item.id)) && (
                        <Check size={14} color="#fff" />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.specTitle}>
                        {item.item}
                      </Text>

                      {item.description?.map((d: any, i: number) => (
                        <Text key={i} style={styles.specDesc}>
                          • {d.description}
                        </Text>
                      ))}
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>

          </ScrollView>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={quotationDetails.validUntil}
          mode="date"
          display="default"
          onChange={(event: any, date?: Date) => {
            setShowDatePicker(false);
            if (date) {
              setQuotationDetails(prev => ({ ...prev, validUntil: date }));
            }
          }}
        />
      )}
    </View>
  );
}

// STYLES START HERE
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerPlaceholder: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  addIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Selected Card
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clientDetails: {
    flex: 1,
    gap: 8,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },

  // Add Card
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  addCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3B82F6',
  },

  // Products
  productsContainer: {
    gap: 12,
  },
  productCard: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Config Row
  configRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 12,
  },
  configField: {
    flex: 1,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  priceInputField: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    height: 44,
  },
  counterButton: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  counterInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  multiplySymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: '#CBD5E1',
    marginBottom: 10,
  },
  productTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  productTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },

  // Discount
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  discountToggle: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 4,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  discountTypeBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountTypeBtnActive: {
    backgroundColor: '#3B82F6',
  },
  discountInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    height: 48,
  },
  discountPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  discountPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  discountPreviewValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },

  // Terms
  termsGrid: {
    gap: 10,
  },
  termChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  termChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  termCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termCheckboxActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  termChipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 18,
  },
  viewAllButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },

  // Payment Terms
  paymentTermsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentTermChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentTermChipActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  paymentTermChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    maxWidth: '90%',
  },

  // Details
  detailsContainer: {
    gap: 16,
  },
  detailItem: {
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  notesTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Summary
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  discountText: {
    color: '#EF4444',
  },
  summaryDivider: {
    height: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  summaryRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabelFinal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryValueFinal: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -0.8,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
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
    fontWeight: '500',
    color: '#0F172A',
  },
  modalList: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 14,
  },
  modalItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  modalItemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalItemSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalItemCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Product Modal
  productModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productModalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCheckboxActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },

  // Terms Modal
  addTermSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addTermInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  addTermButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  termModalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  termModalItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  termModalText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 20,
  },

  // Payment Terms Modal
  addPaymentTermSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addPaymentTermInput: {
    flex: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  addPaymentTermInputSmall: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  paymentTermModalContent: {
    flex: 1,
  },
  paymentTermModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  paymentTermModalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  specCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  specLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  specInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#F8FAFC",
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  specInputSmall: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    backgroundColor: "#F8FAFC",
  },
  addDescriptionButton: {
    borderWidth: 1,
    borderColor: "#3B82F6",
    padding: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  addMoreText: {
    color: "#3B82F6",
    fontSize: 14,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionTitle: {
    marginTop: 20,
    marginLeft: 16,
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  listContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  specItem: {
    flexDirection: "row",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
    gap: 10,
  },
  specItemActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  specTitle: {
    fontWeight: "600",
    color: "#0F172A",
  },
  specDesc: {
    fontSize: 12,
    color: "#64748B",
  },
});