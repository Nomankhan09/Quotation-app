import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { router, useLocalSearchParams } from 'expo-router';
import {  setDiscount } from '@/store/slices/quotationBuilderSlice';
import { ArrowLeft, Percent, IndianRupee } from 'lucide-react-native';
import { handleBackPress } from '@/utils/navigation';

export default function DiscountScreen() {
  const { selectedProducts, discount } = useSelector((state: RootState) => state.quotationBuilder);
  const dispatch = useDispatch();
  
  const params = useLocalSearchParams();
  const editMode = params.editMode === 'true';
  const prefillData = params.prefillData ? JSON.parse(params.prefillData as string) : null;

  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(discount.type);
  const [discountValue, setDiscountValue] = useState(discount.value.toString());
  
  const hasPrefilled = useRef(false);

  // useEffect(() => {
  //   // Set current step when component mounts
  //   dispatch(setCurrentStep('discount'));
  // }, [dispatch]);

  useEffect(() => {
    // Pre-fill discount if in edit mode (run only once)
    if (editMode && prefillData && prefillData.discount && !hasPrefilled.current) {
      setDiscountType(prefillData.discount.type);
      setDiscountValue(prefillData.discount.value.toString());
      dispatch(setDiscount(prefillData.discount));
      hasPrefilled.current = true;
    }
  }, [editMode, prefillData, dispatch]);

  const products = useSelector((state: RootState) => state.products.products);

  const getSubtotal = () => {
    return selectedProducts.reduce((sum, product) => {
      const price = typeof product.totalPrice === 'string' 
        ? parseFloat(product.totalPrice) 
        : product.totalPrice;
      
      return sum + (price || 0);
    }, 0);
  };

  const getDiscountAmount = () => {
    const subtotal = getSubtotal();
    const value = parseFloat(discountValue) || 0;
    
    if (discountType === 'percentage') {
      return (subtotal * value) / 100;
    } else {
      return value;
    }
  };

  const getFinalTotal = () => {
    return getSubtotal() - getDiscountAmount();
  };

  const handleContinue = () => {
    dispatch(setDiscount({
      type: discountType,
      value: parseFloat(discountValue) || 0,
    }));
    router.push({
      pathname: '/quotation/create/terms',
      params: { 
        editMode: editMode ? 'true' : 'false',
        quotationId: params.quotationId,
        prefillData: params.prefillData
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => handleBackPress('/quotation/create/configure-products')}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {editMode ? 'Edit Discount' : 'Apply Discount'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          {selectedProducts.map((selectedProduct) => {
            const product = products.find(p => Number(p.id) === selectedProduct.productId);
            if (!product) return null;

            return (
              <View key={selectedProduct.productId} style={styles.summaryItem}>
                <Text style={styles.summaryProductName}>{product.product_name}</Text>
                <Text style={styles.summaryProductDetails}>
                  {selectedProduct.length} × {selectedProduct.width} {selectedProduct.unit} × {selectedProduct.quantity} qty
                </Text>
                <Text style={styles.summaryProductPrice}>₹{selectedProduct.totalPrice}</Text>
              </View>
            );
          })}
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Subtotal:</Text>
            <Text style={styles.subtotalAmount}>₹{getSubtotal()}</Text>
          </View>
        </View>

        {/* Discount Section */}
        <View style={styles.discountCard}>
          <Text style={styles.discountTitle}>Discount</Text>
          
          <View style={styles.discountTypeContainer}>
            <TouchableOpacity
              style={[styles.discountTypeButton, discountType === 'percentage' && styles.discountTypeActive]}
              onPress={() => setDiscountType('percentage')}
            >
              <Percent size={16} color={discountType === 'percentage' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.discountTypeText, discountType === 'percentage' && styles.discountTypeTextActive]}>
                Percentage
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.discountTypeButton, discountType === 'fixed' && styles.discountTypeActive]}
              onPress={() => setDiscountType('fixed')}
            >
              <IndianRupee size={16} color={discountType === 'fixed' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.discountTypeText, discountType === 'fixed' && styles.discountTypeTextActive]}>
                Fixed Amount
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.discountInputContainer}>
            <TextInput
              style={styles.discountInput}
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="decimal-pad"
              placeholder={discountType === 'percentage' ? '0' : '0.00'}
            />
            <Text style={styles.discountUnit}>
              {discountType === 'percentage' ? '%' : '₹'}
            </Text>
          </View>

          {parseFloat(discountValue) > 0 && (
            <View style={styles.discountPreview}>
              <Text style={styles.discountPreviewLabel}>Discount Amount:</Text>
              <Text style={styles.discountPreviewAmount}>-₹{getDiscountAmount().toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Final Total */}
        <View style={styles.totalCard}>
          <Text style={styles.finalTotalLabel}>Final Total:</Text>
          <Text style={styles.finalTotalAmount}>₹{getFinalTotal().toFixed(2)}</Text>
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
            {editMode ? 'Continue to Edit Terms' : 'Continue to Terms'}
          </Text>
        </TouchableOpacity>
      </View>
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  summaryItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryProductName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  summaryProductDetails: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  summaryProductPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'right',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  subtotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  subtotalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  discountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  discountTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  discountTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  discountTypeActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  discountTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  discountTypeTextActive: {
    color: '#FFFFFF',
  },
  discountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  discountInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  discountUnit: {
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
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
    color: '#64748B',
  },
  discountPreviewAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  finalTotalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10B981',
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
});