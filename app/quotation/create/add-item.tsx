// app/quotation/create/add-item.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Keyboard,
  Alert,
  TouchableWithoutFeedback,
  Modal,
  Platform,
  ScrollView,
  Animated,
  KeyboardAvoidingView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { ArrowLeft, Plus, ChevronDown, X, Minus, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import {
  setSelectedProducts,
  SelectedProduct,
} from '@/store/slices/quotationBuilderSlice';
import { addProduct } from '@/store/slices/productsSlice';
import { addCategory } from '@/store/slices/categoriesSlice';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function AddItemScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { products } = useSelector((s: RootState) => s.products);
  const { categories } = useSelector((s: RootState) => s.categories);
  const { selectedProducts } = useSelector((s: RootState) => s.quotationBuilder);

  const [categoryId, setCategoryId] = useState<string | null>();
  // const [showMainCategoryDropdown, setShowMainCategoryDropdown] = useState(false);
  const [showMainCategoryDropdown, setShowMainCategoryDropdown] = useState(false);
  const [showModalCategoryDropdown, setShowModalCategoryDropdown] = useState(false);


  const [productName, setProductName] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [saveLater, setSaveLater] = useState(false);

  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [lengthVal, setLengthVal] = useState<string>("1");
  const [widthVal, setWidthVal] = useState<string>("1");
  const [unit, setUnit] = useState<'feet' | 'inches'>('feet');

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [modalCategoryId, setModalCategoryId] = useState<string | null>(null);
  const [modalProductName, setModalProductName] = useState('');
  const [modalPrice, setModalPrice] = useState('');
  const [modalDescription, setModalDescription] = useState('');

  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const params = useLocalSearchParams();

  const isEditMode = params.editMode === 'true';
  const editIndex = params.itemIndex ? Number(params.itemIndex) : null;
  const editItem = useMemo(() => {
    if (params.itemData) {
      try {
        return JSON.parse(params.itemData as string);
      } catch {
        return null;
      }
    }
    return null;
  }, [params.itemData]);

  useEffect(() => {
    if (!isEditMode || !editItem) return;

    const matchedCategory = categories.find(
      c => c.category_name === editItem.categoryName
    );

    if (!matchedCategory) {
      console.warn('❌ Category not found for edit item', editItem.categoryName);
      return;
    }

    setCategoryId(String(matchedCategory.id));
    setProductName(editItem.product_name);

    setSelectedProduct({
      id: editItem.productId,
      product_name: editItem.product_name,
      unit_price: editItem.unitPrice,
      category_id: matchedCategory.id,
    });

    setUnitPrice(Number(editItem.unitPrice));
    setQuantity(Number(editItem.quantity));
    setLengthVal(editItem.length);
    setWidthVal(editItem.width);
    setUnit(editItem.unit);

    setShowSuggestions(false);
    setShowMainCategoryDropdown(false);
    setIsNewProduct(false);
  }, [isEditMode, categories]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput | null>(null);

  const suggestions = useMemo(() => {
    if (!productName || selectedProduct || isNewProduct) return [];

    const search = productName.toLowerCase();

    return products.filter((p) => {
      const nameMatch = p.product_name.toLowerCase().includes(search);

      if (!categoryId) return nameMatch;

      return (
        nameMatch &&
        String(p.category_id) === String(categoryId)
      );
    });
  }, [productName, selectedProduct, isNewProduct, products, categoryId]);

  const total = quantity * parseFloat(lengthVal) * parseFloat(widthVal) * unitPrice;

  useEffect(() => {
    if (selectedProduct) {
      setUnitPrice(Number(selectedProduct.unit_price || 0));
      setQuantity(1);
      setLengthVal("1");
      setWidthVal("1");
      if (selectedProduct.category_id) {
        setCategoryId(String(selectedProduct.category_id));
      }
      setShowMainCategoryDropdown(false);
    }
  }, [selectedProduct]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      if (productName.length > 0 && suggestions.length > 0 && !selectedProduct && !isNewProduct) {
        setShowSuggestions(true);
      }
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      // Keep suggestions visible
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [productName, suggestions, selectedProduct, isNewProduct]);

  const closeAllOverlays = () => {
    setShowMainCategoryDropdown(false);
    setShowSuggestions(false);
    setShowAddCategoryModal(false);
    setShowAddProductModal(false);
    setShowUnitDropdown(false);
    Keyboard.dismiss();
  };

  const onSelectSuggestion = (p: any) => {
    if (p.category_id) {
      setCategoryId(String(p.category_id));
    }

    setSelectedProduct(p);
    setProductName(p.product_name);
    setUnitPrice(Number(p.unit_price || 0));
    setShowMainCategoryDropdown(false);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleCreateCategoryInline = async (name: string) => {
    if (!name.trim()) return;
    const colorList = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const color = colorList[Math.floor(Math.random() * colorList.length)];
    try {
      const res: any = await dispatch(addCategory({ category_name: name.trim(), description: 'NA', color }));
      const newId = res?.payload?.id ?? null;
      if (newId) {
        setCategoryId(String(newId));
      } else {
        const found = categories.find(c => c.category_name.toLowerCase() === name.trim().toLowerCase());
        if (found) setCategoryId(found.id);
      }
      setNewCategoryName('');
      setShowAddCategoryModal(false);
      setShowMainCategoryDropdown(false);
    } catch (e) {
      console.log('create category failed', e);
      Alert.alert('Error', 'Failed to create category');
    }
  };

  const handleSave = async () => {
    if (!categoryId) {
      Alert.alert('Category required', 'Please select a category first.');
      return;
    }
    if (!productName.trim()) {
      Alert.alert('Name required', 'Please enter product/item name.');
      return;
    }
    if (quantity <= 0 || unitPrice < 0) {
      Alert.alert('Invalid values', 'Check quantity/price values.');
      return;
    }

    let productId = selectedProduct?.id;

    if (!productId && isNewProduct && saveLater) {
      const payload = {
        product_name: productName.trim(),
        unit_price: unitPrice,
        description: '',
        category_id: Number(categoryId),
      };
      try {
        const res: any = await dispatch(addProduct(payload) as any);
        productId = res?.payload?.id;
      } catch (e) {
        console.warn('addProduct failed', e);
      }
    }

    const category = categories.find(c => String(c.id) === String(categoryId));

    const item: SelectedProduct = {
      productId: productId ?? `tmp:${productName.trim()}`,
      product_name: productName.trim(),
      categoryId: categoryId,
      categoryName: category?.category_name || 'Other',
      unitPrice,
      quantity,
      length: parseFloat(lengthVal) || 0,
      width: parseFloat(widthVal) || 0,
      unit,
      totalPrice: total,
    };

    let newList;
    if (isEditMode && editIndex !== null) {
      newList = selectedProducts.map((p, idx) => idx === editIndex ? item : p);
    } else {
      // const exists = selectedProducts.some(p => p.productId === item.productId);
      // newList = exists
      //   ? selectedProducts.map(p => (p.productId === item.productId ? item : p))
      //   : [...selectedProducts, item];
      newList = [...selectedProducts, item];
    }

    dispatch(setSelectedProducts(newList));
    router.back();
  };

  const handleSaveProductFromModal = async () => {
    if (!modalCategoryId || !modalProductName || !modalPrice) {
      Alert.alert('Error', 'Category, name & price required');
      return;
    }

    const res: any = await dispatch(
      addProduct({
        product_name: modalProductName.trim(),
        unit_price: Number(modalPrice),
        description: modalDescription.trim(),
        category_id: Number(modalCategoryId),
      })
    );

    const p = res.payload;

    // setCategoryId(String(p.category_id));
    setProductName(p.product_name);
    setUnitPrice(Number(p.unit_price));
    setSelectedProduct(p);

    // setModalCategoryId(null);
    setModalProductName('');
    setModalPrice('');
    setModalDescription('');
    setShowAddProductModal(false);
  };

  const handleCategoryPick = async (catId: string) => {
    if (showAddProductModal) {
      setModalCategoryId(catId);
    } else {
      setCategoryId(catId);
      await AsyncStorage.setItem('lastCategoryId', String(catId));
    }
    setShowMainCategoryDropdown(false);
    if (!selectedProduct && productName.length > 0) {
      setShowSuggestions(true);
    }
  };

  const changeQty = (by: number) => setQuantity(q => Math.max(1, q + by));
  const changeLength = (by: number) => {
    setLengthVal((v) => {
      const current = parseFloat(v) || 0;
      const updated = Math.max(0, Math.round((current + by) * 100) / 100);
      return updated.toString();
    });
  };
  const changeWidth = (by: number) => {
    setWidthVal((v) => {
      const current = parseFloat(v) || 0;
      const updated = Math.max(0, Math.round((current + by) * 100) / 100);
      return updated.toString();
    });
  };

  const selectedCategoryName = categoryId
    ? categories.find(c => String(c.id) === String(categoryId))?.category_name
    : null;

  const modalSelectedCategoryName = modalCategoryId
    ? categories.find(c => String(c.id) === String(modalCategoryId))?.category_name
    : null;

  useEffect(() => {
    const loadCategory = async () => {
      const saved = await AsyncStorage.getItem('lastCategoryId');
      if (saved) {
        setCategoryId(saved);
      }
    };

    loadCategory();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={closeAllOverlays}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEditMode ? 'Edit Item' : 'Add Item'}</Text>
          <View style={{ width: 22 }} />
        </View>

        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}          // ← critical for Android
          enableAutomaticScroll={true}    // ← auto scrolls focused input above keyboard
          extraScrollHeight={20}          // ← extra gap between input and keyboard top
          extraHeight={120}               // ← accounts for footer button height
          keyboardOpeningTime={0}
        >
          <TouchableWithoutFeedback onPress={closeAllOverlays}>
            <View>

              {/* Category Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Category *</Text>
                <View style={styles.categoryRow}>
                  <TouchableOpacity
                    style={styles.categoryPicker}
                    onPress={() => {
                      setShowMainCategoryDropdown(v => !v);
                      setShowSuggestions(false);
                      setShowUnitDropdown(false);
                      Keyboard.dismiss();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryPickerText,
                      !categoryId && styles.placeholderText
                    ]}>
                      {selectedCategoryName || 'Select category'}
                    </Text>
                    <ChevronDown size={18} color="#64748B" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickAddButton}
                    onPress={() => {
                      setShowAddCategoryModal(true);
                      setShowMainCategoryDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Plus size={18} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Category Dropdown */}
                {showMainCategoryDropdown && (
                  <View style={[styles.dropdown, { maxHeight: 250 }]}>
                    <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="always">
                      {categories.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => handleCategoryPick(item.id)}
                        >
                          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                          <Text style={styles.dropdownItemText}>{item.category_name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Product Name */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Product / Item Name *</Text>
                <View style={styles.itemRow}>
                  <View style={styles.inputWrapper}>
                    <Search size={18} color="#94A3B8" style={styles.searchIcon} />
                    <TextInput
                      ref={inputRef}
                      style={styles.inputWithIcon}
                      placeholder="Search or enter new product name"
                      placeholderTextColor="#94A3B8"
                      value={productName}
                      onChangeText={(t) => {
                        setProductName(t);
                        setSelectedProduct(null);
                        setIsNewProduct(false);
                        if (t.length > 0 && suggestions.length > 0) setShowSuggestions(true);
                        else setShowSuggestions(false);
                      }}
                      onFocus={() => {
                        if (productName.length > 0 && suggestions.length > 0) setShowSuggestions(true);
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.quickAddButton}
                    onPress={() => setShowAddProductModal(true)}
                    activeOpacity={0.7}
                  >
                    <Plus size={18} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <View style={styles.suggestionBox}>
                    <View>
                      {suggestions.map((item) => {
                        const cat = categories.find(c => String(c.id) === String(item.category_id));

                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.suggestionRow}
                            onPress={() => onSelectSuggestion(item)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.suggestionContent}>
                              <Text style={styles.suggName}>{item.product_name}</Text>
                              <Text style={styles.suggMeta}>
                                {cat ? cat.category_name : 'Uncategorized'}
                              </Text>
                            </View>

                            <Text style={styles.suggPrice}>
                              ₹{Number(item.unit_price).toFixed(2)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Add New Product Option */}
                {!selectedProduct && !isNewProduct && productName.length > 0 && categoryId && suggestions.length === 0 && (
                  <TouchableOpacity
                    style={styles.addNewRow}
                    onPress={() => {
                      setIsNewProduct(true);
                      setSaveLater(true);
                      setShowSuggestions(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color="#2563EB" />
                    <Text style={styles.addNewText}>Add "{productName}" as new product</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Configuration Section */}
              {categoryId && (
                <View style={styles.configSection}>
                  <View style={styles.configHeader}>
                    <Text style={styles.configTitle}>
                      {productName || 'New Item'}
                    </Text>
                    {selectedProduct && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Existing</Text>
                      </View>
                    )}
                    {isNewProduct && (
                      <View style={[styles.badge, styles.badgeNew]}>
                        <Text style={styles.badgeText}>New</Text>
                      </View>
                    )}
                  </View>

                  {/* Price & Quantity Row */}
                  <View style={styles.configRow}>
                    <View style={styles.configField}>
                      <Text style={styles.fieldLabel}>Unit Price</Text>
                      <View style={styles.priceInputWrapper}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <TextInput
                          style={styles.priceInput}
                          keyboardType="decimal-pad"
                          value={unitPrice.toString()}
                          onChangeText={(t) => setUnitPrice(Number(t) || 0)}
                          placeholder="0.00"
                          placeholderTextColor="#CBD5E1"
                        />
                      </View>
                    </View>

                    <View style={styles.configField}>
                      <Text style={styles.fieldLabel}>Quantity</Text>
                      <View style={styles.counterWrapper}>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => changeQty(-1)}
                          activeOpacity={0.7}
                        >
                          <Minus size={16} color="#64748B" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.counterInput}
                          keyboardType="number-pad"
                          value={quantity.toString()}
                          onChangeText={(t) => setQuantity(Math.max(1, Number(t) || 1))}
                        />
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => changeQty(1)}
                          activeOpacity={0.7}
                        >
                          <Plus size={16} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Dimensions Row */}
                  <View style={styles.dimensionsRow}>
                    <View style={styles.dimensionField}>
                      <Text style={styles.fieldLabel}>Length</Text>
                      <View style={styles.counterWrapper}>
                        <TouchableOpacity
                          style={styles.smallCounterBtn}
                          onPress={() => changeLength(-0.1)}
                          activeOpacity={0.7}
                        >
                          <Minus size={16} color="#64748B" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.counterInput}
                          keyboardType="decimal-pad"
                          value={lengthVal}
                          onChangeText={(t) => setLengthVal(t)}
                        />
                        <TouchableOpacity
                          style={styles.smallCounterBtn}
                          onPress={() => changeLength(0.1)}
                          activeOpacity={0.7}
                        >
                          <Plus size={16} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.multiplySymbol}>×</Text>

                    <View style={styles.dimensionField}>
                      <Text style={styles.fieldLabel}>Width</Text>
                      <View style={styles.counterWrapper}>
                        <TouchableOpacity
                          style={styles.smallCounterBtn}
                          onPress={() => changeWidth(-0.1)}
                          activeOpacity={0.7}
                        >
                          <Minus size={16} color="#64748B" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.counterInput}
                          keyboardType="decimal-pad"
                          value={widthVal}
                          onChangeText={(t) => setWidthVal(t)}
                        />
                        <TouchableOpacity
                          style={styles.smallCounterBtn}
                          onPress={() => changeWidth(0.1)}
                          activeOpacity={0.7}
                        >
                          <Plus size={16} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.unitField}>
                      <Text style={styles.fieldLabel}>Unit</Text>
                      <TouchableOpacity
                        style={styles.unitPicker}
                        onPress={() => setShowUnitDropdown(v => !v)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.unitText}>{unit}</Text>
                        <ChevronDown size={14} color="#64748B" />
                      </TouchableOpacity>

                      {showUnitDropdown && (
                        <View style={styles.unitDropdown}>
                          <TouchableOpacity
                            style={styles.unitOption}
                            onPress={() => {
                              setUnit('feet');
                              setShowUnitDropdown(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.unitOptionText}>feet</Text>
                          </TouchableOpacity>
                          <View style={styles.separator} />
                          <TouchableOpacity
                            style={styles.unitOption}
                            onPress={() => {
                              setUnit('inches');
                              setShowUnitDropdown(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.unitOptionText}>inches</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Total Display */}
                  <View style={styles.totalContainer}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Amount</Text>
                      <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.calculation}>
                      {quantity} × {parseFloat(lengthVal) || 0} × {parseFloat(widthVal) || 0} × ₹{unitPrice.toFixed(2)}
                    </Text>
                  </View>

                  {/* Save Later Toggle */}
                  {isNewProduct && (
                    <TouchableOpacity
                      style={styles.saveLaterRow}
                      onPress={() => setSaveLater(v => !v)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.toggle, saveLater && styles.toggleOn]}>
                        <View style={[styles.knob, saveLater && styles.knobOn]} />
                      </View>
                      <View style={styles.saveLaterContent}>
                        <Text style={styles.saveLaterText}>Save as product</Text>
                        <Text style={styles.saveLaterDesc}>
                          Add this to your product catalog for future use
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>

        {/* Save Button (Fixed at bottom) */}
        {categoryId && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveText}>
                {isEditMode ? 'Update Item' : 'Add to Quotation'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Category Modal */}
        <Modal
          visible={showAddCategoryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddCategoryModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowAddCategoryModal(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Category</Text>
                <TouchableOpacity onPress={() => setShowAddCategoryModal(false)}>
                  <X size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Category name"
                placeholderTextColor="#94A3B8"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                style={styles.modalInput}
                autoFocus
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setShowAddCategoryModal(false)}
                  style={[styles.modalBtn, styles.cancelBtn]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCreateCategoryInline(newCategoryName)}
                  style={[styles.modalBtn, styles.createBtn]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.createText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Product Modal */}
        <Modal
          visible={showAddProductModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddProductModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowAddProductModal(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Product</Text>
                <TouchableOpacity onPress={() => setShowAddProductModal(false)}>
                  <X size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalForm}>
                <Text style={styles.modalLabel}>Category *</Text>
                <TouchableOpacity
                  style={styles.modalPicker}
                  onPress={() => {
                    setShowModalCategoryDropdown(v => !v);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.modalPickerText,
                    !modalCategoryId && styles.placeholderText
                  ]}>
                    {modalSelectedCategoryName || 'Select category'}
                  </Text>
                  <ChevronDown size={18} color="#64748B" />
                </TouchableOpacity>

                {showModalCategoryDropdown && (
                  <View style={styles.dropdown}>
                    <FlatList
                      data={categories}
                      keyExtractor={(i) => String(i.id)}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setModalCategoryId(String(item.id));
                            setShowModalCategoryDropdown(false);
                          }}
                        >
                          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                          <Text style={styles.dropdownItemText}>
                            {item.category_name}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}


                <Text style={styles.modalLabel}>Product Name *</Text>
                <TextInput
                  placeholder="Enter product name"
                  placeholderTextColor="#94A3B8"
                  value={modalProductName}
                  onChangeText={setModalProductName}
                  style={styles.modalInput}
                />

                <Text style={styles.modalLabel}>Unit Price *</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="decimal-pad"
                    value={modalPrice}
                    onChangeText={setModalPrice}
                    style={styles.priceInput}
                  />
                </View>

                <Text style={styles.modalLabel}>Description (Optional)</Text>
                <TextInput
                  placeholder="Add product description"
                  placeholderTextColor="#94A3B8"
                  value={modalDescription}
                  onChangeText={setModalDescription}
                  style={[styles.modalInput, styles.textArea]}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setShowAddProductModal(false)}
                  style={[styles.modalBtn, styles.cancelBtn]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveProductFromModal}
                  style={[styles.modalBtn, styles.createBtn]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.createText}>Add Product</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Category & Item Rows
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryPicker: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryPickerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  placeholderText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  quickAddButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Input
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },

  // Dropdown
  dropdown: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dropdownAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  dropdownAddText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },

  // Suggestions
  suggestionBox: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  suggestionContent: {
    flex: 1,
  },
  suggName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  suggMeta: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  suggPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // Add New Product
  addNewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    gap: 10,
  },
  addNewText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
    flex: 1,
  },

  // Configuration Section
  configSection: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#F1F5F9',
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  badgeNew: {
    backgroundColor: '#D1FAE5',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Config Rows
  configRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  configField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Price Input
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Counter
  counterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    height: 48,
  },
  counterBtn: {
    width: 34,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  smallCounterBtn: {
    width: 26,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  counterInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Dimensions
  dimensionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 20,
  },
  dimensionField: {
    flex: 1,
  },
  multiplySymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: '#CBD5E1',
    marginBottom: 12,
  },
  unitField: {
    width: 80,
    position: 'relative',
  },
  unitPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 4,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  unitDropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
    overflow: 'hidden',
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  unitOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Total
  totalContainer: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.5,
  },
  calculation: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
    textAlign: 'right',
  },

  // Save Later Toggle
  saveLaterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveLaterContent: {
    flex: 1,
  },
  saveLaterText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  saveLaterDesc: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    padding: 3,
  },
  toggleOn: {
    backgroundColor: '#10B981',
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  knobOn: {
    alignSelf: 'flex-end',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  modalForm: {
    gap: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalPickerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  createBtn: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
