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
import { RootState, AppDispatch } from '@/store';
import { addProduct, Product, setProductSearch } from '@/store/slices/productsSlice';
import { Plus, X, IndianRupee, ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ProductsScreen() {
  const { products, search } = useSelector((state: RootState) => state.products);
  const { categories } = useSelector((state: RootState) => state.categories);
  const dispatch = useDispatch<AppDispatch>();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
  });
  const [searchQuery, setSearchQuery] = useState(search);

  // Simple local search
  const filteredProducts = products.filter(product =>
    product.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    dispatch(setProductSearch(text));
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.categoryId) {
      Alert.alert('Error', 'Please fill in all fields and select a category');
      return;
    }

    if (!newProduct.description) {
      newProduct.description = 'NA'
    }

    const price = parseFloat(newProduct.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const res = await dispatch(addProduct({
      product_name: newProduct.name,
      description: newProduct.description,
      unit_price: price,
      category_id: Number(newProduct.categoryId)
    })).unwrap();

    if (res.status === 400) {
      Alert.alert('Error', res.message);
      return;
    }

    setNewProduct({
      name: '',
      description: '',
      price: '',
      categoryId: '',
    });
    setShowAddModal(false);
    Alert.alert('Success', 'Product added successfully!');
  };

  const toggleCategory = (categoryId: string) => {
    setNewProduct(prev => ({
      ...prev,
      categoryId: prev.categoryId === categoryId ? '' : categoryId
    }));
  };

  const getCategoryNames = (categoryId: string) => {
    const category = categories.find(cat => cat.id == categoryId);
    return category ? category.category_name : '';
  };

  const handleAddCategory = () => {
    setShowAddModal(false);
    router.push('/categories');
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productCard}>
      <Text style={styles.productName}>{item.product_name}</Text>
      <Text style={styles.productDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.priceContainer}>
        <IndianRupee size={16} color="#10B981" />
        <Text style={styles.price}>
          {Number(item.unit_price || 0).toFixed(2)}
        </Text>
      </View>

      <View style={styles.categoryContainer}>
        <Text style={styles.categoryLabel}>Category:</Text>
        <Text style={styles.categoryText} numberOfLines={1}>
          {getCategoryNames(item.category_id)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

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
                returnKeyType="next"
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
                onPress={handleAddCategory}
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
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
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  categoryText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
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