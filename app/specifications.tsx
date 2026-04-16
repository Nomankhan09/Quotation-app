import React, { useEffect, useState } from 'react';
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
import { Plus, X, Grid3x3 as Grid3X3 } from 'lucide-react-native';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { addSpecification, setSpecificationSearch, Specification } from '@/store/slices/specificationsSlice';
import { loadAllSpecifications } from '@/store/slices/specificationsSlice';

export default function SpecificationsScreen() {
  const { specifications, search } = useSelector((state: RootState) => state.specifications);
  const dispatch = useDispatch<AppDispatch>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(search);

  // Single view
  const [selectedSpecification, setSelectedSpecification] = useState<Specification | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      item: '',
      description: [{ description: '' }],
    },
  });

  useEffect(() => {
    dispatch(loadAllSpecifications());
  }, []);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'description',
  });

  // Simple local search
  const filteredSpecifications = specifications.filter(specification =>
    specification.item?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    specification.description?.some(d =>
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    dispatch(setSpecificationSearch(text));
  };

  const onSubmit = async (data: any) => {
    // Format like your backend expects
    const payload = {
      item: data.item,
      description: data.description.map((d: any) => ({
        description: d.description,
      })),
    };

    const res = await dispatch(addSpecification(payload)).unwrap();

    if (res.status === 400) {
      Alert.alert('Error', res.message);
      return;
    }

    Alert.alert('Success', 'Specification added successfully!');
    reset();
    setShowAddModal(false);
  };

  const renderSpecificationItem = ({ item }: { item: Specification }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => {
        setSelectedSpecification(item);
        setShowViewModal(true);
      }}
    >

      {/* Icon (no color now, so use fixed) */}
      <View style={[styles.categoryIcon, { backgroundColor: '#8B5CF620' }]}>
        <Grid3X3 size={20} color="#8B5CF6" />
      </View>

      <View style={styles.categoryInfo}>

        {/* ITEM NAME */}
        <Text style={styles.categoryName}>{item.item}</Text>

        {/* MULTIPLE DESCRIPTIONS */}
        <Text style={styles.categoryDescription} numberOfLines={2}>
          {item.description
            ?.map((d: { description: string }) => d.description)
            .join(', ')}
        </Text>

      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Specifications</Text>
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
          placeholder="Search specifications..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Categories List */}
      <FlatList
        data={filteredSpecifications}
        renderItem={renderSpecificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No specifications found</Text>
          </View>
        }
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
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Specification</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.formScrollView}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ITEM */}
            <View style={styles.inputContainer}>
              <Controller
                control={control}
                name="item"
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Item Name *"
                    value={value}
                    onChangeText={onChange}
                    placeholderTextColor="#94A3B8"
                  />
                )}
              />
            </View>

            {/* MULTIPLE DESCRIPTIONS */}
            {fields.map((field, index) => (
              <View key={field.id} style={styles.inputContainer}>
                <Controller
                  control={control}
                  name={`description.${index}.description`}
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder={`Description ${index + 1}`}
                      value={value}
                      onChangeText={onChange}
                      placeholderTextColor="#94A3B8"
                    />
                  )}
                />

                {/* Remove button */}
                {fields.length > 1 && (
                  <TouchableOpacity onPress={() => remove(index)}>
                    <Text style={{ color: 'red', marginTop: 5 }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Add more button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#E2E8F0',
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 10,
              }}
              onPress={() => append({ description: '' })}
            >
              <Text>Add Description +</Text>
            </TouchableOpacity>

            <View style={styles.modalFooterSpacer} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* view single specification */}
      <Modal
        visible={showViewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowViewModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>

          {/* HEADER */}
          <View
            style={{
              paddingTop: 50,
              paddingBottom: 16,
              paddingHorizontal: 20,
              backgroundColor: '#FFFFFF',
              borderBottomWidth: 1,
              borderColor: '#E2E8F0',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>
              Specification
            </Text>

            <TouchableOpacity onPress={() => setShowViewModal(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* CONTENT */}
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >

            {/* ITEM CARD */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                padding: 16,
                borderRadius: 16,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 6 }}>
                ITEM NAME
              </Text>

              <Text style={{ fontSize: 18, fontWeight: '600', color: '#0F172A' }}>
                {selectedSpecification?.item}
              </Text>
            </View>

            {/* DESCRIPTION HEADER */}
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>
                DESCRIPTIONS ({selectedSpecification?.description?.length || 0})
              </Text>
            </View>

            {/* DESCRIPTION LIST */}
            {selectedSpecification?.description?.map((d, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                {/* Number badge */}
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: '#8B5CF6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                    {index + 1}
                  </Text>
                </View>

                {/* Text */}
                <Text style={{ flex: 1, color: '#334155', fontSize: 14, lineHeight: 20 }}>
                  {d.description}
                </Text>
              </View>
            ))}

            {/* EMPTY STATE */}
            {selectedSpecification?.description?.length === 0 && (
              <Text style={{ textAlign: 'center', color: '#94A3B8', marginTop: 20 }}>
                No descriptions available
              </Text>
            )}

          </ScrollView>
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