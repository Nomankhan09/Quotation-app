import React, { useCallback, useEffect, useState } from 'react';
import { RootState } from '@/store';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList, Alert,
  ScrollView, Platform,
  useWindowDimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { router, useFocusEffect } from 'expo-router';
import {
  Plus, ChevronRight, Percent, IndianRupee, FileText, CreditCard, Check, X, Search, User,
  Package, Trash2, ArrowLeft, ShoppingBag, Tag, SlidersHorizontal,
} from 'lucide-react-native';
import { generateQuotationHTML } from '@/services/pdfService';
import {
  setDiscount, resetForNewQuotation, setSpecifications, loadAllSpecifications,
  loadAllTerms, loadAllPaymentTerms
} from '@/store/slices/quotationBuilderSlice';
import { updateQuotation } from '@/services/quotationService';
import { getQuotations, saveQuotation } from '@/store/slices/quotationsSlice';
import { getRoman } from '@/utils/roman_number';
import type { AppDispatch } from '@/store';
import Avatar from '@/utils/avatar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateFileName } from '@/utils/quotation';
import { File, Paths } from 'expo-file-system';
import { ActivityIndicator } from 'react-native';

export default function CreateQuotationIndex() {
  const dispatch = useDispatch<AppDispatch>()
  const { width } = useWindowDimensions();
  const isSmall = width < 400;
  const leads = useSelector((s: any) => (s && s.leads ? s.leads.leads || [] : []));
  const qb = useSelector((state: RootState) => state.quotationBuilder);
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const selectedLead = qb.selectedLead || null;
  const selectedProducts = qb.selectedProducts || [];
  const reduxDiscount = qb.discount || { type: 'percentage', value: 0 };
  const allTerms = qb.terms || [];
  const selectedTerms = qb.selectedTerms || [];
  const allSpecifications = qb.allSpecifications || []; // full list
  const selectedSpecifications = qb.selectedSpecifications || []; // selected ids
  const allPaymentTerms = qb.paymentTerms || [];
  const selectedPaymentTerms = qb.selectedPaymentTerms || [];
  const isEditMode = qb.isEditMode || false;
  const editingQuotationId = qb.editingQuotationId || null;

  const [showClientModal, setShowClientModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSpecificationModal, setShowSpecificationModal] = useState(false);
  const [discountType, setDiscountType] = useState(reduxDiscount.type || 'percentage');
  const [discountValue, setDiscountValue] = useState(String(reduxDiscount.value || '0'));
  const [search, setSearch] = useState('');
  const [savedQuotationId, setSavedQuotationId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const buildQuotationData = (
    quotationId?: number
  ) => ({
    user,

    quotationNumber:
      quotationId ||
      editingQuotationId ||
      `QT-${Date.now()}`,

    lead: selectedClient,

    products: selectedProducts,

    subtotal,

    discount: {
      type:
        discountType === 'percentage'
          ? 'percent'
          : 'fixed',

      value:
        Number(discountValue) || 0,
    },

    discountAmount:
      getDiscountAmount(),
    totalAmount: total,
    specifications:
      selectedSpecifications,
    terms: allTerms.filter(
      (t: any) =>
        selectedTerms
          .map(Number)
          .includes(Number(t.id))
    ),

    paymentTerms:
      allPaymentTerms.filter(
        (p: any) =>
          selectedPaymentTerms
            .map(Number)
            .includes(Number(p.id))
      ),

    created_at:
      new Date().toISOString(),
  });

  // Reusable Quotation payload
  const buildQuotationPayload = () => ({
    leadId: selectedLead,
    products: selectedProducts.map((p) => ({
      ...p,
      productId: Number(p.productId),
      unitPrice: Number(p.unitPrice),
      quantity: Number(p.quantity),
      length: p.length ? Number(p.length) : null,
      width: p.width ? Number(p.width) : null,
      totalPrice: Number(p.totalPrice),
    })),
    subtotal,
    discount: {
      type:
        discountType === 'percentage'
          ? 'percent'
          : 'fixed',

      value: Number(discountValue) || 0,
    },
    discountAmount: getDiscountAmount(),
    totalAmount: total,
    specifications: selectedSpecifications,
    terms: selectedTerms,
    paymentTerms: selectedPaymentTerms,
    status: 'sent',
  });

  // universal save quotation
  const saveOrUpdateQuotation = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = buildQuotationPayload();

      // UPDATE
      if (
        isEditMode ||
        savedQuotationId
      ) {

        const quotationId =
          savedQuotationId || Number(editingQuotationId);

        if (!token) {
          Alert.alert('Authentication required', 'Please sign in to update quotations.');
          return;
        }


        await updateQuotation(
          quotationId,
          payload,
          token
        );

        return quotationId;
      }

      // CREATE
      const response = await dispatch(
        saveQuotation(payload)
      ).unwrap();

      const quotationId =
        response?.quotation?.id ||
        response?.id;

      setSavedQuotationId(quotationId);

      return quotationId;
    } catch (err) {
      console.log('add edit err', err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (isEditMode && !editingQuotationId) return;

    dispatch(loadAllSpecifications());
    dispatch(loadAllTerms());
    dispatch(loadAllPaymentTerms());
  }, [isEditMode, editingQuotationId]);

  useEffect(() => {
    if (isEditMode && qb.prefillData?.specifications) {
      const mapped = qb.prefillData.specifications.map((s: any) =>
        String(s.id)
      );

      dispatch(setSpecifications(mapped));
    }
  }, [qb.prefillData, isEditMode]);

  useEffect(() => {
    if (!isEditMode && allSpecifications.length > 0) {
      const allIds = allSpecifications.map(s => String(s.id));

      dispatch(setSpecifications(allIds));
    }
  }, [isEditMode, allSpecifications]);

  useEffect(() => {
    setDiscountType(reduxDiscount.type || 'percentage');
    setDiscountValue(String(reduxDiscount.value || '0'));
  }, [reduxDiscount]);

  // useEffect(() => {
  //   if (!isEditMode) return;
  //   if (!selectedLead) return;
  //   if (!Array.isArray(leads) || leads.length === 0) return;

  //   const client = leads.find(l => l.id === selectedLead);

  //   if (!client) {
  //     console.warn('⚠️ Lead ID exists but not found in leads list', selectedLead);
  //   }
  // }, [leads, selectedLead, isEditMode]);

  // useFocusEffect(
  //   useCallback(() => {
  //     dispatch(resetForNewQuotation());
  //   }, [])
  // );

  const selectedClient = leads.find((l: { id: any; }) => l.id === selectedLead);

  const subtotal = (selectedProducts || []).reduce((sum: any, p: { totalPrice: number; }) => {
    const price = typeof p.totalPrice === 'string' ? parseFloat(p.totalPrice) : p.totalPrice;
    return sum + (price || 0);
  }, 0);

  const getDiscountAmount = () => {
    const v = parseFloat(discountValue) || 0;
    if (discountType === 'percentage') return (subtotal * v) / 100;
    return v;
  };

  const total = Math.max(0, subtotal - getDiscountAmount());

  const openAddItems = () => {
    router.push('/quotation/create/add-item');
  };

  const handleEditItem = (item: any, index: number) => {
    router.push({
      pathname: '/quotation/create/add-item',
      params: {
        editMode: 'true',
        itemIndex: index.toString(),
        itemData: JSON.stringify(item),
      },
    });
  };

  const handleRemoveItem = (productId: number, index: number) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedProducts = selectedProducts.filter(
              (_, i) => i !== index
            );
            dispatch({ type: 'quotationBuilder/setSelectedProducts', payload: updatedProducts });
          },
        },
      ]
    );
  };

  const openSelectLead = () => router.push('/quotation/create/select-lead');

  const handleSelectLead = (leadId: any) => {
    dispatch({ type: 'quotationBuilder/setSelectedLead', payload: leadId });
    setShowClientModal(false);
  };

  const toggleTerm = (termId: any) => {
    const normalizedId = Number(termId);

    const current = selectedTerms.map(Number);

    const updated = current.includes(normalizedId)
      ? current.filter((t) => t !== normalizedId)
      : [...current, normalizedId];

    dispatch({
      type: 'quotationBuilder/setTerms',
      payload: updated,
    });
  };

  const togglePaymentTerm = (id: any) => {
    const normalizedId = Number(id);

    const current = selectedPaymentTerms.map(Number);

    const updated = current.includes(normalizedId)
      ? current.filter((t) => t !== normalizedId)
      : [...current, normalizedId];

    dispatch({
      type: 'quotationBuilder/setPaymentTerms',
      payload: updated,
    });
  };

  const toggleSpecification = (id: string) => {
    const stringId = String(id);
    const exists = selectedSpecifications.includes(stringId);

    const updated = exists
      ? selectedSpecifications.filter(s => s !== stringId)
      : [...selectedSpecifications, stringId];

    dispatch(setSpecifications(updated)); // ✅ FIX
  };

  const saveDiscountToStore = () => {
    dispatch(setDiscount({ type: discountType, value: parseFloat(discountValue) || 0 }));
    Alert.alert('Success', 'Discount updated successfully');
  };

  const handlePreview = async () => {
    if (!selectedClient || selectedProducts.length === 0) {
      Alert.alert('Incomplete', 'Please select a client and add items');
      return;
    }

    if (previewLoading) return;
    setPreviewLoading(true);

    let quotationId;
    try {

      quotationId =
        await saveOrUpdateQuotation();

      if (!quotationId) {
        return;
      }

    } catch (error: any) {

      Alert.alert(
        'Error',
        error.message ||
        'Failed to save quotation'
      );

      return;
    } finally {
      setPreviewLoading(false);
    }
    const quotationData = buildQuotationData(
      quotationId
    );

    const html = generateQuotationHTML(quotationData, allSpecifications);

    router.push({
      pathname: '/quotation/create/html-preview',
      params: { html, leadName: selectedClient.full_name },
    });
  };

  // Generate quotation
  const handleGenerateQuotation =
    async () => {

      if (
        !selectedClient ||
        selectedProducts.length === 0
      ) {
        Alert.alert(
          'Incomplete',
          'Please select a client and add items'
        );

        return;
      }

      if (generateLoading) return;
      setGenerateLoading(true);

      try {

        // Alert.alert(
        //   'Generating PDF',
        //   'Please wait...'
        // );

        // SAVE OR UPDATE FIRST
        const quotationId = await saveOrUpdateQuotation();

        if (!quotationId) {
          return;
        }

        // BUILD DATA
        const quotationData = buildQuotationData(quotationId);

        // GENERATE HTML
        const html = generateQuotationHTML(
          quotationData,
          allSpecifications
        );

        // GENERATE PDF
        const { uri } = await Print.printToFileAsync({ html });

        const fileName = generateFileName({
          format: user?.pdf_file_name_format || 'Quotation_{date}',
          companyName: user?.company_name || '',
          clientName: selectedClient?.full_name || '',
          companyType: user?.company_type || '',
        });

        const newFile = new File(Paths.document, fileName);

        const buffer = await fetch(uri)
          .then(res =>
            res.arrayBuffer()
          );

        const data = new Uint8Array(buffer);

        await newFile.create({
          overwrite: true,
        });

        await newFile.write(data);

        // SHARE / DOWNLOAD
        if (await Sharing.isAvailableAsync()) {

          await Sharing.shareAsync(newFile.uri,
            {
              mimeType:
                'application/pdf',

              dialogTitle:
                'Download Quotation PDF',

              UTI:
                'com.adobe.pdf',
            }
          );
        } else {

          Alert.alert(
            'Success',
            'PDF generated successfully!'
          );
        }

      } catch (error: any) {

        console.error(
          'Error generating PDF:',
          error
        );

        Alert.alert(
          'Error',
          error.message ||
          'Failed to generate PDF'
        );
      } finally {
        setGenerateLoading(false);
      }
    };

  const handleSave = async () => {
    if (!selectedClient || selectedProducts.length === 0) {
      Alert.alert('Incomplete', 'Please select a client and add items');
      return;
    }

    if (saveLoading) return;
    setSaveLoading(true);
    // const currentEditMode = isEditMode;
    // const currentQuotationId = editingQuotationId;
    // const currentLead = selectedLead;
    // const currentProducts = [...selectedProducts];
    // const currentDiscountType = discountType;
    // const currentDiscountValue = discountValue;

    try {

      const quotationId = await saveOrUpdateQuotation();

      dispatch(
        getQuotations({
          page: 1,
          loadMore: false,
        }) as any
      );

      // dispatch(resetForNewQuotation());

      Alert.alert(
        'Success',
        isEditMode || quotationId === savedQuotationId
          ? 'Quotation updated successfully!'
          : 'Quotation created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)/quotations');

              setTimeout(() => {
                dispatch(resetForNewQuotation());
              }, 300);
            },
          },
        ]
      );

    } catch (error: any) {

      console.error(
        '❌ Error saving quotation:',
        error
      );

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to save quotation';

      Alert.alert('Error', errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleSection}>
            <Text style={styles.headerTitle}>
              {isEditMode ? 'Edit Quotation' : 'New Quotation'}
            </Text>
            {isEditMode && editingQuotationId && (
              <Text style={styles.headerSubtitle}>#{editingQuotationId}</Text>
            )}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={handlePreview}
              activeOpacity={0.7}
              disabled={previewLoading}
            >
              <Text style={styles.previewButtonText}>
                {
                  previewLoading ? (
                    <ActivityIndicator
                      color="#475569"
                      size="small"
                    />
                  ) : (
                    <Text style={styles.previewButtonText}>
                      Preview
                    </Text>
                  )
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Client Selection Card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Client Information</Text>
          <TouchableOpacity
            style={styles.clientCard}
            onPress={openSelectLead}
            activeOpacity={0.7}
          >
            <View style={styles.clientCardContent}>
              {selectedClient ?
                <Avatar height={45} width={45} item={selectedClient} />
                : <View style={styles.clientIcon}>
                  <User size={24} color="#3B82F6" />
                </View>
              }

              {selectedClient ? (
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{selectedClient.full_name}</Text>
                  <Text style={styles.clientCompany}>{selectedClient.company_name}</Text>
                </View>
              ) : (
                <View style={styles.clientInfo}>
                  <Text style={styles.clientPlaceholder}>Select a client</Text>
                  <Text style={styles.clientPlaceholderSub}>Tap to choose from your leads</Text>
                </View>
              )}
            </View>

            <ChevronRight size={20} color="#94A3B8" />
          </TouchableOpacity>


        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Items</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openAddItems}
              activeOpacity={0.7}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {selectedProducts.length === 0 ? (
            <View style={styles.emptyItemsCard}>
              <ShoppingBag size={48} color="#CBD5E1" />
              <Text style={styles.emptyItemsTitle}>No items added</Text>
              <Text style={styles.emptyItemsSubtitle}>
                Tap "Add Item" to start building your quotation
              </Text>
            </View>
          ) : (
            <View style={styles.itemsCard}>
              {selectedProducts.map((item: any, index: number) => (
                <View
                  key={`${item.productId}-${index}`}
                  style={[
                    styles.itemCard,
                    index === selectedProducts.length - 1 && styles.itemCardLast
                  ]}
                >
                  <TouchableOpacity
                    style={styles.itemContent}
                    onPress={() => handleEditItem(item, index)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.product_name}</Text>
                      <Text style={styles.itemPrice}>₹{Number(item.totalPrice).toFixed(2)}</Text>
                    </View>

                    <View style={styles.itemDetails}>
                      <View style={styles.itemBadge}>
                        <Package size={12} color="#64748B" />
                        <Text style={styles.itemBadgeText}>
                          {item.quantity} × {item.length} × {item.width} {item.unit}
                        </Text>
                      </View>
                      <View style={styles.itemBadge}>
                        <Tag size={12} color="#64748B" />
                        <Text style={styles.itemBadgeText}>
                          ₹{Number(item.unitPrice).toFixed(2)}/unit
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.itemActions}>
                    {/* <TouchableOpacity
                      style={[styles.itemActionButton, styles.editButton]}
                      onPress={() => handleEditItem(item, index)}
                      activeOpacity={0.7}
                    >
                      <Edit2 size={16} color="#3B82F6" />
                    </TouchableOpacity> */}
                    <TouchableOpacity
                      style={[styles.itemActionButton, styles.deleteButton]}
                      onPress={() => handleRemoveItem(item.productId, index)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.itemsSummary}>
                <Text style={styles.itemsSummaryText}>
                  {selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''} • Subtotal: ₹{subtotal.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Discount Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Discount</Text>
          <View style={styles.discountCard}>
            <View style={styles.discountControls}>
              <View style={styles.discountTypeToggle}>
                <TouchableOpacity
                  style={[
                    styles.discountTypeButton,
                    discountType === 'percentage' && styles.discountTypeButtonActive
                  ]}
                  onPress={() => setDiscountType('percentage')}
                  activeOpacity={0.7}
                >
                  <Percent size={18} color={discountType === 'percentage' ? '#fff' : '#64748B'} />
                  <Text style={[
                    styles.discountTypeText,
                    discountType === 'percentage' && styles.discountTypeTextActive
                  ]}>
                    %
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.discountTypeButton,
                    discountType === 'fixed' && styles.discountTypeButtonActive
                  ]}
                  onPress={() => setDiscountType('fixed')}
                  activeOpacity={0.7}
                >
                  <IndianRupee size={18} color={discountType === 'fixed' ? '#fff' : '#64748B'} />
                  <Text style={[
                    styles.discountTypeText,
                    discountType === 'fixed' && styles.discountTypeTextActive
                  ]}>
                    Fixed
                  </Text>
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

              <TouchableOpacity
                style={styles.discountSaveButton}
                onPress={saveDiscountToStore}
                activeOpacity={0.7}
              >
                <Check size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {parseFloat(discountValue || '0') > 0 && (
              <View style={styles.discountPreview}>
                <Text style={styles.discountPreviewLabel}>Discount Amount</Text>
                <Text style={styles.discountPreviewValue}>
                  -₹{getDiscountAmount().toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Terms & Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Terms, Payment & Specification</Text>

          <TouchableOpacity
            style={styles.termsCard}
            onPress={() => setShowPaymentModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.termsCardHeader}>
              <View style={styles.termsIcon}>
                <CreditCard size={20} color="#10B981" />
              </View>
              <Text style={styles.termsCardTitle}>Payment Terms</Text>
              <View style={styles.termsBadge}>
                <Text style={styles.termsBadgeText}>{selectedPaymentTerms.length}</Text>
              </View>
            </View>

            {selectedPaymentTerms.length > 0 && (
              <View style={styles.termsPreview}>
                {selectedPaymentTerms.slice(0, 2).map((id: any) => {
                  const p = allPaymentTerms.find((x: { id: any; }) => Number(x.id) === Number(id));
                  return p ? (
                    <Text key={id} style={styles.termsPreviewText} numberOfLines={1}>
                      • {(p as any).description}
                    </Text>
                  ) : null;
                })}
                {selectedPaymentTerms.length > 2 && (
                  <Text style={styles.termsPreviewMore}>
                    +{selectedPaymentTerms.length - 2} more
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.termsCard}
            onPress={() => setShowTermsModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.termsCardHeader}>
              <View style={[styles.termsIcon, { backgroundColor: '#FEE2E2' }]}>
                <FileText size={20} color="#EF4444" />
              </View>
              <Text style={styles.termsCardTitle}>Terms & Conditions</Text>
              <View style={styles.termsBadge}>
                <Text style={styles.termsBadgeText}>{selectedTerms.length}</Text>
              </View>
            </View>

            {selectedTerms.length > 0 && (
              <View style={styles.termsPreview}>
                {selectedTerms.slice(0, 2).map((id: any) => {
                  const t = allTerms.find((x: { id: any; }) => Number(x.id) === Number(id));
                  return t ? (
                    <Text key={id} style={styles.termsPreviewText} numberOfLines={1}>
                      • {(t as any).text}
                    </Text>
                  ) : null;
                })}
                {selectedTerms.length > 2 && (
                  <Text style={styles.termsPreviewMore}>
                    +{selectedTerms.length - 2} more
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Specification Card */}
          <TouchableOpacity
            style={styles.termsCard}
            onPress={() => setShowSpecificationModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.termsCardHeader}>
              <View style={[styles.termsIcon, { backgroundColor: '#e2d8f9' }]}>
                <SlidersHorizontal size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.termsCardTitle}>Specifications</Text>
              <View style={styles.termsBadge}>
                <Text style={styles.termsBadgeText}>{selectedSpecifications.length}</Text>
              </View>
            </View>

            {selectedSpecifications.length > 0 && (
              <View style={styles.termsPreview}>
                {selectedSpecifications.slice(0, 2).map((id: any) => {
                  const s = allSpecifications.find((x) => String(x?.id) === String(id));
                  return s ? (
                    <Text key={id} style={styles.termsPreviewText} numberOfLines={1}>
                      • {s.item}
                    </Text>
                  ) : null;
                })}
                {selectedSpecifications.length > 2 && (
                  <Text style={styles.termsPreviewMore}>
                    +{selectedSpecifications.length - 2} more
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Bottom Summary */}
      <View style={styles.bottomBar}>
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, styles.discountText]}>
              -₹{getDiscountAmount().toFixed(2)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelTotal}>Total</Text>
            <Text style={styles.summaryValueTotal}>₹{total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.btnContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              saveLoading && styles.disabledButton
            ]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={saveLoading}
          >
            {saveLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                style={styles.saveButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                ellipsizeMode="tail"
              >
                {isEditMode ? 'Update Quotation' : 'Add Quotation'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              generateLoading && styles.disabledButton
            ]}
            onPress={handleGenerateQuotation}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {
                generateLoading ? (
                  <ActivityIndicator
                    color="#fff"
                    size="small"
                  />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Generate Quotation
                  </Text>
                )
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Client Selection Modal */}
      <Modal
        visible={showClientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClientModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Client</Text>
            <TouchableOpacity
              onPress={() => setShowClientModal(false)}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearchContainer}>
            <View style={styles.modalSearchWrapper}>
              <Search size={20} color="#94A3B8" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search clients..."
                style={styles.modalSearchInput}
                placeholderTextColor="#CBD5E1"
              />
            </View>
          </View>

          <FlatList
            data={(leads || []).filter((l: { full_name: any; company_name: any; }) =>
              (l.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
              (l.company_name || '').toLowerCase().includes(search.toLowerCase())
            )}
            keyExtractor={(i) => String(i.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleSelectLead(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.modalItemContent}>
                  <View style={styles.modalItemAvatar}>
                    <User size={22} color="#3B82F6" />
                  </View>
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemName}>{item.full_name}</Text>
                    <Text style={styles.modalItemCompany}>{item.company_name}</Text>
                  </View>
                </View>
                {selectedLead === item.id && (
                  <View style={styles.modalItemCheck}>
                    <Check size={20} color="#10B981" />
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <TouchableOpacity
              onPress={() => setShowTermsModal(false)}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={allTerms}
            keyExtractor={(t) => String(t.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalCheckItem}
                onPress={() => toggleTerm(item.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  selectedTerms.map(String).includes(String(item.id)) && styles.checkboxActive
                ]}>
                  {selectedTerms.map(String).includes(String(item.id)) && <Check size={16} color="#fff" />}
                </View>
                <Text style={styles.modalCheckItemText}>{item.text}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      {/* Payment Terms Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Terms</Text>
            <TouchableOpacity
              onPress={() => setShowPaymentModal(false)}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={allPaymentTerms}
            keyExtractor={(p) => Number(p.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalCheckItem}
                onPress={() => togglePaymentTerm(item.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  selectedPaymentTerms.map(Number).includes(Number(item.id)) && styles.checkboxActive
                ]}>
                  {selectedPaymentTerms.map(Number).includes(Number(item.id)) && <Check size={16} color="#fff" />}
                </View>
                <Text style={styles.modalCheckItemText}>
                  {item.description} {item.value ? `- ${item.value}` : ''}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      {/* Specification Modal */}
      <Modal
        visible={showSpecificationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSpecificationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Specifications</Text>
            <TouchableOpacity
              onPress={() => setShowSpecificationModal(false)}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={allSpecifications}
            keyExtractor={(p) => String(p.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalCheckItem}
                onPress={() => toggleSpecification(item.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedSpecifications.includes(String(item.id)) && styles.checkboxActive,
                  ]}
                >
                  {selectedSpecifications.includes(String(item.id)) && (
                    <Check size={16} color="#fff" />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  {/* Heading */}
                  <Text style={styles.modalCheckItemText}>
                    {item.item}
                  </Text>

                  {/* Descriptions as roman list */}
                  {item.description?.map((d: { description: string }, index: number) => (
                    <Text key={index} style={styles.modalCheckItemDescription}>
                      {`${getRoman(index + 1)}. ${d.description}`}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
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

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  previewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  // Client Card
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  clientCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  clientIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  clientCompany: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  clientPlaceholder: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  clientPlaceholderSub: {
    fontSize: 13,
    color: '#CBD5E1',
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty Items
  emptyItemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyItemsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyItemsSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Items Card
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  itemCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  itemCardLast: {
    borderBottomWidth: 0,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  itemBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  itemActions: {
    gap: 8,
    justifyContent: 'center',
  },
  itemActionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  itemsSummary: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  itemsSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },

  // Discount Card
  discountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  discountControls: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  discountTypeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  discountTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  discountTypeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  discountTypeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  discountTypeTextActive: {
    color: '#FFFFFF',
  },
  discountInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  discountSaveButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  discountPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  discountPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  discountPreviewValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444',
  },

  // Terms Card
  termsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  termsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  termsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  termsBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  termsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  termsPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  termsPreviewText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  termsPreviewMore: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },

  // Bottom Bar
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  summarySection: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  discountText: {
    color: '#EF4444',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryValueTotal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -0.5,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 24,
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
  modalSearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  modalSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    height: 52,
  },
  modalSearchInput: {
    marginLeft: 12,
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  modalList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  modalItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  modalItemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  modalItemCompany: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  modalItemCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Checkboxes
  modalCheckItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  modalCheckItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 22,
  },
  modalCheckItemDescription: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#0F172A',
    lineHeight: 22,
  },
  fieldWrapper: {
    marginTop: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#444",
    marginBottom: 6,
  },
  stageSelector: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  stageSelectorText: {
    color: "#111",
  },
  stageDropdown: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 5,
    borderRadius: 8,
  },

  stageOption: {
    padding: 10,
  },

  stageOptionText: {
    color: "#333",
  },
  stageOptionActive: {
    backgroundColor: '#F9FAFB',
  },
  stageOptionTextActive: {
    fontWeight: '600',
    color: '#111827',
  },
  btnContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
});