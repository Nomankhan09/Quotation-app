import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import {
  setSearch,
} from '@/store/slices/leadsSlice';
import {
  Plus,
  Search,
} from 'lucide-react-native';
import { StageBadge } from '@/utils/stageBadge';
import Avatar from '@/utils/avatar';
import { STAGES } from '@/constants/constant';
import { router } from 'expo-router';
import { ILead } from '@/interface/leads';
import ContactFormModal from '@/components/ContactFormModal';

export default function LeadsScreen() {
  const dispatch = useDispatch<any>();
  const { leads, search } = useSelector(
    (state: RootState) => state.leads
  );
  const [searchQuery, setSearchQuery] = useState(search);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState('All');

  const handlePress = (contact: any) => {
    router.push({
      pathname: '/ContactDetailScreen',
      params: { contact: JSON.stringify(contact) },
    });
  };

  // Simple local search
  const filteredLeads = leads.filter((lead: ILead) => {
    const searchText = searchQuery.toLowerCase();

    const matchesSearch =
      lead.full_name?.toLowerCase().includes(searchText) ||
      lead.company_name?.toLowerCase().includes(searchText) ||
      lead.email?.toLowerCase().includes(searchText);

    const matchesStage =
      selectedStage === 'All' || lead.stage === selectedStage;

    return matchesSearch && matchesStage;
  });

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    dispatch(setSearch(text));
  };

  const renderLeadItem = ({ item }) => (
    <TouchableOpacity style={styles.leadCard} onPress={() => handlePress(item)}>
      <View style={styles.row}>
        {/* Avatar */}
        <Avatar item={item} />

        {/* Name + Phone */}
        <View style={{ flex: 1 }}>
          <Text style={styles.leadName}>{item.full_name}</Text>

          {item.phone && (
            <Text style={styles.phoneText}>{item.phone}</Text>
          )}
        </View>

        {/* Stage Badge */}
        {item.stage && (
          <StageBadge stage={item.stage} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
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
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Stage Filter */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>

          {['All', ...STAGES].map((item, index) => {
            const isActive = selectedStage === item;

            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedStage(item)}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive
                  ]}
                >
                  {item} ({item === 'All'
                    ? leads.length
                    : leads.filter(lead => lead.stage === item).length
                  })
                </Text>
              </TouchableOpacity>
            );
          })}

        </ScrollView>
      </View>

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        renderItem={renderLeadItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add Lead Modal with Keyboard Handling */}
      <ContactFormModal
        visible={showAddModal}
        mode="add"
        STAGES={STAGES}
        onClose={() => setShowAddModal(false)}
      />
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
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 5,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  leadCompany: {
    fontSize: 14,
    color: '#64748B',
  },
  leadDetails: {
    gap: 8,
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
  // Row (side by side)
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  phoneText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  filterRow: {
    marginHorizontal: 20,
    marginBottom: 10,
  },

  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },

  filterChipActive: {
    backgroundColor: '#007AFF',
  },

  filterText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },

  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});