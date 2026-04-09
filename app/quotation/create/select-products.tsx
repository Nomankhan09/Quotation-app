import React, { useState, useEffect, useRef } from 'react';
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
import { setSelectedProducts } from '@/store/slices/quotationBuilderSlice';
import { addProduct } from '@/store/slices/productsSlice';
import { addCategory } from '@/store/slices/categoriesSlice';
import { 
  ArrowLeft, 
  Package, 
  Check, 
  Search, 
  Plus, 
  X, 
  IndianRupee, 
  ChevronDown,
  Grid3x3 as Grid3X3
} from 'lucide-react-native';
import { setCurrentStep } from '@/store/slices/quotationBuilderSlice';
import { handleBackPress } from '@/utils/navigation';

export default function SelectProductsScreen() {
  const { products } = useSelector((state: RootState) => state.products);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { selectedProducts } = useSelector((state: RootState) => state.quotationBuilder);
  const dispatch = useDispatch<any>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
  });
  const [newCategory, setNewCategory] = useState({
    category_name: '',
    description: '',
  });
  const [activeProduct, setActiveProduct] = useState<any | null>(null);


  const params = useLocalSearchParams();
  const editMode = params.editMode === 'true';
  const prefillData = params.prefillData ? JSON.parse(params.prefillData as string) : null;
  
  const hasPrefilled = useRef(false);

  useEffect(() => {
    dispatch(setCurrentStep('select-products'));
  }, [dispatch]);

  useEffect(() => {
    // Pre-fill products if in edit mode (run only once)
    if (editMode && prefillData && prefillData.products && !hasPrefilled.current) {
      const prefillProducts = prefillData.products.map((product: any) => ({
        productId: product.productId,
        unitPrice: product.unitPrice,
        length: product.length,
        width: product.width,
        quantity: product.quantity,
        unit: product.unit,
        totalPrice: product.totalPrice,
      }));
      dispatch(setSelectedProducts(prefillProducts));
      hasPrefilled.current = true;
    }
  }, [editMode, prefillData, dispatch]);

  const getCategoryNames = (categoryId: string) => {
    return categories.find(cat => cat.id == categoryId)?.category_name;
  };

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCategoryNames(product.category_id)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProduct = (productId: string) => {
    const isSelected = selectedProducts.some(p => p.productId === productId);
    let updatedProducts;
    
    if (isSelected) {
      updatedProducts = selectedProducts.filter(p => p.productId !== productId);
    } else {
      const product = products.find(p => p.id === productId);
      if (product) {
        updatedProducts = [...selectedProducts, {
          productId: productId,
          unitPrice: product.unit_price,
          length: 1,
          width: 1,
          quantity: 1,
          unit: 'feet' as 'feet' | 'inches',
          totalPrice: product.unit_price,
        }];
      } else {
        return;
      }
    }
    
    dispatch(setSelectedProducts(updatedProducts));
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.categoryId) {
      Alert.alert('Error', 'Please fill in all fields and select a category');
      return;
    }

    if(!newProduct.description){
      newProduct.description = 'NA'
    }

    const price = parseFloat(newProduct.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    dispatch(addProduct({
      product_name: newProduct.name,
      description: newProduct.description,
      unit_price: price,
      category_id: Number(newProduct.categoryId)
    }));

    setNewProduct({
      name: '',
      description: '',
      price: '',
      categoryId: '',
    });
    setShowAddModal(false);
    Alert.alert('Success', 'Product added successfully!');
  };

  const handleAddCategory = () => {
    if (!newCategory.category_name || !newCategory.description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#14B8A6', // Teal
    ];

    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    dispatch(addCategory({ ...newCategory, color: randomColor }));

    setNewCategory({
      category_name: '',
      description: '',
    });

    setShowCategoryModal(false);
    setTimeout(() => setShowAddModal(true), 100);
    Alert.alert('Success', 'Category added successfully!');
  };

  // const handleContinue = () => {
  //   if (selectedProducts.length === 0) {
  //     return;
  //   }
  //   router.push({
  //     pathname: '/quotation/create/configure-products',
  //     params: { 
  //       editMode: editMode ? 'true' : 'false',
  //       quotationId: params.quotationId,
  //       prefillData: params.prefillData
  //     }
  //   });
  // };

  const renderProductItem = ({ item }: { item: any }) => {
    const isSelected = selectedProducts.some(p => p.productId === item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.productCard, isSelected && styles.selectedCard]}
        onPress={() => {
  const existing = selectedProducts.find(p => p.productId === item.id);

if (existing) {
  setActiveProduct({
    ...existing,
    totalPrice: Number(existing.totalPrice) || 0
  });
  } else {
    setActiveProduct({
      productId: item.id,
      unitPrice: item.unit_price,
      quantity: 1,
      length: 1,
      width: 1,
      unit: 'feet',
      totalPrice: item.unit_price,
    });
  }
}}


      >
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.productPrice}>₹{item.unit_price}</Text>
          <Text style={styles.productCategories}>
            Categories: {getCategoryNames(item.category_id)}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Check size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => handleBackPress('/quotation/create/select-lead')}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {editMode ? 'Edit Products' : 'Select Products'}
        </Text>
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
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Selected Count */}
      <View style={styles.selectedContainer}>
        <Text style={styles.selectedText}>
          {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Continue Button */}
      {selectedProducts.length > 0 && (
        <View style={styles.footer}>
          {/* <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>
              {editMode ? 'Continue to Configure' : 'Continue with ' + selectedProducts.length + ' product' + (selectedProducts.length !== 1 ? 's' : '')}
            </Text>
          </TouchableOpacity> */}
        </View>
      )}

      {/* Add Product Modal */}
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
            <Text style={styles.modalTitle}>Add New Product</Text>
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
              <TextInput
                style={styles.input}
                placeholder="Product Name *"
                value={newProduct.name}
                onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Description"
                value={newProduct.description}
                onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputContainer}>
              <IndianRupee size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Unit Price *"
                value={newProduct.price}
                onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                keyboardType="decimal-pad"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Category Selection Row */}
            <View style={styles.categoryRow}>
              <TouchableOpacity
                style={[styles.categoryPicker, { flex: 1 }]}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Text style={styles.categoryPickerLabel}>
                  {newProduct.categoryId
                    ? `Selected: ${categories.find(cat => cat.id === newProduct.categoryId)?.category_name}`
                    : 'Select Category *'
                  }
                </Text>
                <ChevronDown size={20} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.addCategoryButton}
                onPress={() => {
                  setShowAddModal(false);
                  setTimeout(() => setShowCategoryModal(true), 100);
                }}
              >
                <Plus size={20} color="#3B82F6" />
                <Text style={styles.addCategoryText}>Add</Text>
              </TouchableOpacity>
            </View>

            {showCategoryDropdown && (
              <View style={styles.dropdownList}>
                <View style={styles.dropdownHeader}>
                  <TextInput
                    style={styles.categorySearchInput}
                    placeholder="Search category..."
                    placeholderTextColor="#94A3B8"
                    value={categorySearch}
                    onChangeText={setCategorySearch}
                  />
                </View>
                {categories
                  .filter(cat =>
                    cat.category_name.toLowerCase().includes(categorySearch.toLowerCase())
                  )
                  .map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.dropdownItem,
                        newProduct.categoryId === category.id && styles.selectedDropdownItem
                      ]}
                      onPress={() => {
                        setNewProduct({ ...newProduct, categoryId: category.id });
                        setShowCategoryDropdown(false);
                        setCategorySearch('');
                      }}
                    >
                      <Text style={{ color: category.color }}>{category.category_name}</Text>
                    </TouchableOpacity>
                  ))}
                {categories.filter(cat =>
                  cat.category_name.toLowerCase().includes(categorySearch.toLowerCase())
                ).length === 0 && (
                  <Text style={{ padding: 16, color: '#64748B' }}>No categories found</Text>
                )}
              </View>
            )}

            {newProduct.categoryId && (
              <View style={styles.selectedCategories}>
                <View style={[styles.categoryTag, { backgroundColor: categories.find(c => c.id === newProduct.categoryId)?.color + '20' }]}>
                  <Text style={[styles.categoryTagText, { color: categories.find(c => c.id === newProduct.categoryId)?.color }]}>
                    {getCategoryNames(newProduct.categoryId)}
                  </Text>
                </View>
              </View>
            )}

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
              onPress={handleAddProduct}
            >
              <Text style={styles.saveButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCategoryModal(false);
          setTimeout(() => setShowAddModal(true), 100);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TouchableOpacity onPress={() => {
              setShowCategoryModal(false);
              setTimeout(() => setShowAddModal(true), 100);
            }}>
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
              <TextInput
                style={styles.input}
                placeholder="Category Name *"
                value={newCategory.category_name}
                onChangeText={(text) => setNewCategory({ ...newCategory, category_name: text })}
                placeholderTextColor="#94A3B8"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Description *"
                value={newCategory.description}
                onChangeText={(text) => setNewCategory({ ...newCategory, description: text })}
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
              onPress={() => {
                setShowCategoryModal(false);
                setTimeout(() => setShowAddModal(true), 100);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddCategory}
            >
              <Text style={styles.saveButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {activeProduct && (
  <View style={styles.configSheet}>
    <Text style={styles.sheetTitle}>Configure Product</Text>

    <TextInput
      value={String(activeProduct.quantity)}
      keyboardType="number-pad"
      onChangeText={(v) =>
        setActiveProduct((p: { unitPrice: number; length: number; width: number; }) => ({
          ...p,
          quantity: Number(v) || 1,
          totalPrice: p.unitPrice * p.length * p.width * (Number(v) || 1)
        }))
      }
    />

    <TextInput
      value={String(activeProduct.length)}
      keyboardType="decimal-pad"
      onChangeText={(v) =>
        setActiveProduct((p: { unitPrice: number; width: number; quantity: number; }) => ({
          ...p,
          length: Number(v) || 0,
          totalPrice: p.unitPrice * (Number(v) || 0) * p.width * p.quantity
        }))
      }
    />

    <TextInput
      value={String(activeProduct.width)}
      keyboardType="decimal-pad"
      onChangeText={(v) =>
        setActiveProduct((p: { unitPrice: number; length: number; quantity: number; }) => ({
          ...p,
          width: Number(v) || 0,
          totalPrice: p.unitPrice * p.length * (Number(v) || 0) * p.quantity
        }))
      }
    />

    <Text style={{ marginVertical: 10 }}>
      Total: ₹{Number(activeProduct.totalPrice || 0).toFixed(2)}
    </Text>

    <TouchableOpacity
      onPress={() => {
        dispatch(
  setSelectedProducts(
    selectedProducts.some(p => p.productId === activeProduct.productId)
      ? selectedProducts.map(p =>
          p.productId === activeProduct.productId ? activeProduct : p
        )
      : [...selectedProducts, activeProduct]
  )
);
setActiveProduct(null);

      }}
    >
      <Text>Add Item</Text>
    </TouchableOpacity>
  </View>
)}

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
  selectedContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectedText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 135, // Increased padding for Android
  },
  productCard: {
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
  selectedCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  productCategories: {
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
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  descriptionInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  // Category Row Styles
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  categoryPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPickerLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  addCategoryText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  selectedCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 4,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categorySearchInput: {
    fontSize: 16,
    color: '#1E293B',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedDropdownItem: {
    backgroundColor: '#EFF6FF',
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
  configSheet: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#fff',
  padding: 16,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  borderWidth: 1,
  borderColor: '#E2E8F0',
},
sheetTitle: {
  fontSize: 16,
  fontWeight: '700',
  marginBottom: 12,
},

});