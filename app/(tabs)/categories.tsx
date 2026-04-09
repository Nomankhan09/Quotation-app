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
import { addCategory, Category, setCategorySearch } from '@/store/slices/categoriesSlice';
import { Plus, X, Grid3x3 as Grid3X3 } from 'lucide-react-native';

export default function CategoriesScreen() {
  const { categories, search } = useSelector((state: RootState) => state.categories);
  const dispatch = useDispatch<AppDispatch>();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    category_name: '',
    description: '',
    color: '#3B82F6',
  });
  const [searchQuery, setSearchQuery] = useState(search);

  // Simple local search
  const filteredCategories = categories.filter(category =>
    category.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    dispatch(setCategorySearch(text));
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
      color: '#3B82F6',
    });

    setShowAddModal(false);
    Alert.alert('Success', 'Category added successfully!');
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity style={styles.categoryCard}>
      <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
        {/* <Grid3X3 size={20} color={item.color} /> */}
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.category_name}</Text>
        <Text style={styles.categoryDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          {/* <Plus size={20} color="#FFFFFF" /> */}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Categories List */}
      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Category Modal */}
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
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              {/* <X size={24} color="#64748B" /> */}
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
              onPress={() => setShowAddModal(false)}
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
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
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
    gap: 20,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    fontSize: 16,
    color: '#1E293B',
  },
  descriptionInput: {
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
});