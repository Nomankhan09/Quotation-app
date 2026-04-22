import React, { useEffect } from 'react';
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
import { updateProductConfig, SelectedProduct } from '@/store/slices/quotationBuilderSlice';
import { ArrowLeft, Package, Ruler } from 'lucide-react-native';
// import { setCurrentStep } from '@/store/slices/quotationBuilderSlice';
import { handleBackPress } from '@/utils/navigation';

export default function ConfigureProductsScreen() {
  const { products } = useSelector((state: RootState) => state.products);
  const { selectedProducts } = useSelector((state: RootState) => state.quotationBuilder);
  const dispatch = useDispatch();

  const params = useLocalSearchParams();
  const editMode = params.editMode === 'true';

  // useEffect(() => {
  //   dispatch(setCurrentStep('configure-products'));
  // }, [dispatch]);

  const updateProduct = (productId: number, field: string, value: any) => {
    const updatedProducts = selectedProducts.map(p => {
      if (p.productId === productId) {
        const updated = { ...p, [field]: value };
        
        // Recalculate total price
        let length = updated.length;
        let width = updated.width;
        
        // Convert to feet if in inches for calculation
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

  const toggleUnit = (productId: number) => {
    const product = selectedProducts.find(p => p.productId === productId);
    if (!product) return;
    
    const newUnit = product.unit === 'feet' ? 'inches' : 'feet';
    let newLength = product.length;
    let newWidth = product.width;
    
    // Convert measurements
    if (newUnit === 'inches') {
      // Convert feet to inches
      newLength = Math.round(product.length * 12 * 100) / 100;
      newWidth = Math.round(product.width * 12 * 100) / 100;
    } else {
      // Convert inches to feet
      newLength = Math.round((product.length / 12) * 100) / 100;
      newWidth = Math.round((product.width / 12) * 100) / 100;
    }
    
    // Update all fields at once to avoid multiple dispatches
    const updatedProducts: SelectedProduct[] = selectedProducts.map(p => {
      if (p.productId === productId) {
        const updated: SelectedProduct = { 
          ...p, 
          unit: newUnit,
          length: newLength,
          width: newWidth
        };
        
        // Recalculate total price (always calculate in feet)
        let calcLength = newLength;
        let calcWidth = newWidth;
        
        if (newUnit === 'inches') {
          calcLength = newLength / 12;
          calcWidth = newWidth / 12;
        }
        
        updated.totalPrice = updated.unitPrice * calcLength * calcWidth * updated.quantity;
        return updated;
      }
      return p;
    });
    
    dispatch(updateProductConfig(updatedProducts));
  };

  const getSquareFeet = (product: SelectedProduct) => {
    let length = product.length;
    let width = product.width;
    
    if (product.unit === 'inches') {
      length = length / 12;
      width = width / 12;
    }
    
    return (length * width).toFixed(2);
  };

  const getTotalAmount = () => {
    return selectedProducts.reduce((sum, product) => {
      const price = typeof product.totalPrice === 'string' 
        ? parseFloat(product.totalPrice) 
        : product.totalPrice;
      
      return sum + (price || 0);
    }, 0);
  };

  const handleContinue = () => {
    router.push({
      pathname: '/quotation/create/discount',
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
          onPress={() => handleBackPress('/quotation/create/select-products')}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {editMode ? 'Edit Products Configuration' : 'Configure Products'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedProducts.map((selectedProduct) => {
          const product = products.find(p => Number(p.id) === selectedProduct.productId);
          if (!product) return null;

          return (
            <View key={selectedProduct.productId} style={styles.productCard}>
              <View style={styles.productHeader}>
                <Package size={16} color="#3B82F6" />
                <Text style={styles.productName}>{product.product_name}</Text>
              </View>

              <View style={styles.configRow}>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Unit Price</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={selectedProduct.unitPrice.toString()}
                    onChangeText={(text) => updateProduct(selectedProduct.productId, 'unitPrice', parseFloat(text) || 0)}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                </View>

                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Quantity</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={selectedProduct.quantity.toString()}
                    onChangeText={(text) => updateProduct(selectedProduct.productId, 'quantity', parseInt(text) || 0)}
                    keyboardType="number-pad"
                    placeholder="1"
                  />
                </View>
              </View>

              <View style={styles.measurementSection}>
                <View style={styles.measurementHeader}>
                  <View style={styles.measurementTitle}>
                    <Ruler size={14} color="#64748B" />
                    <Text style={styles.configLabel}>Measurements</Text>
                  </View>
                  <View style={styles.unitToggleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.unitToggle,
                        selectedProduct.unit === 'feet' ? styles.unitToggleActive : styles.unitToggleInactive
                      ]}
                      onPress={() => selectedProduct.unit !== 'feet' && toggleUnit(selectedProduct.productId)}
                    >
                      <Text style={[
                        styles.unitToggleText,
                        selectedProduct.unit === 'feet' ? styles.unitToggleTextActive : styles.unitToggleTextInactive
                      ]}>
                        Feet
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.unitToggle,
                        selectedProduct.unit === 'inches' ? styles.unitToggleActive : styles.unitToggleInactive
                      ]}
                      onPress={() => selectedProduct.unit !== 'inches' && toggleUnit(selectedProduct.productId)}
                    >
                      <Text style={[
                        styles.unitToggleText,
                        selectedProduct.unit === 'inches' ? styles.unitToggleTextActive : styles.unitToggleTextInactive
                      ]}>
                        Inches
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.measurementInputs}>
                  <View style={styles.measurementInput}>
                    <Text style={styles.inputLabel}>Length</Text>
                    <TextInput
                      style={styles.input}
                      value={selectedProduct.length.toString()}
                      onChangeText={(text) => updateProduct(selectedProduct.productId, 'length', parseFloat(text) || 0)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                  <Text style={styles.multiplySign}>×</Text>
                  <View style={styles.measurementInput}>
                    <Text style={styles.inputLabel}>Width</Text>
                    <TextInput
                      style={styles.input}
                      value={selectedProduct.width.toString()}
                      onChangeText={(text) => updateProduct(selectedProduct.productId, 'width', parseFloat(text) || 0)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.sqftContainer}>
                    <Text style={styles.inputLabel}>Sq Feet</Text>
                    <View style={styles.sqftDisplay}>
                      <Text style={styles.sqftText}>{getSquareFeet(selectedProduct)}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalPrice}>
                  ₹{typeof selectedProduct.totalPrice === 'number' 
                    ? selectedProduct.totalPrice.toFixed(2) 
                    : parseFloat(selectedProduct.totalPrice).toFixed(2)}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={styles.grandTotalCard}>
          <Text style={styles.grandTotalLabel}>Grand Total:</Text>
          <Text style={styles.grandTotalPrice}>₹{getTotalAmount().toFixed(2)}</Text>
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
            {editMode ? 'Continue to Edit Discount' : 'Continue to Discount'}
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100, // Increased padding to ensure content doesn't get hidden
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  configRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  configItem: {
    flex: 1,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 36,
  },
  measurementSection: {
    marginBottom: 10,
  },
  measurementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  measurementTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 2,
    width: 120,
  },
  unitToggle: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  unitToggleActive: {
    backgroundColor: '#3B82F6',
  },
  unitToggleInactive: {
    backgroundColor: 'transparent',
  },
  unitToggleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  unitToggleTextActive: {
    color: '#FFFFFF',
  },
  unitToggleTextInactive: {
    color: '#64748B',
  },
  measurementInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  measurementInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 36,
  },
  multiplySign: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: 'bold',
    marginBottom: 8,
    marginHorizontal: 2,
  },
  sqftContainer: {
    flex: 1,
  },
  sqftDisplay: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    height: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sqftText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
    textAlign: 'center',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  grandTotalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  grandTotalPrice: {
    fontSize: 18,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});