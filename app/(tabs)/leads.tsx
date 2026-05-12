import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Linking,
  AppState,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import {
  editLead,
  Lead,
  setSearch,
} from '@/store/slices/leadsSlice';
import {
  Phone,
  Plus,
  Search,
  X,
} from 'lucide-react-native';
import { StageBadge } from '@/utils/stageBadge';
import Avatar from '@/utils/avatar';
import { router } from 'expo-router';
import ContactFormModal from '@/components/ContactFormModal';
import { loadStatuses } from '@/store/slices/contactStatusSlice';
import { timeAgo } from '@/utils/date_format';
import StatusPickerModal from '@/components/StatusPickerModal';
import * as Notifications from 'expo-notifications';
import { CallLogForm } from '../lead/contact-details';
import CallLogModal from '@/components/CallLogModal';
import { addCallLog } from '@/store/slices/callLogSlice';

export default function LeadsScreen() {
  const dispatch = useDispatch<any>();
  const { leads, search } = useSelector(
    (state: RootState) => state.leads
  );
  const { statuses, initialized } = useSelector(
    (state: RootState) => state.contactStatus
  );
  const [searchQuery, setSearchQuery] = useState(search);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState('All');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showCallLogSheet, setShowCallLogSheet] = useState<boolean>(false);
  const appState = useRef(AppState.currentState);
  const callInitiatedRef = useRef(false);

  // default value for call log
  const defaultValues: CallLogForm = {
    type: "OUTGOING",
    durationObj: {
      hours: "",
      minutes: "",
      seconds: "",
    },
  }

  // save call log
  const handleSaveCallLog = (data: CallLogForm) => {
    let totalSeconds = 0;

    if (data.type !== "MISSED") {
      const h = parseInt(data.durationObj?.hours || '0', 10);
      const m = parseInt(data.durationObj?.minutes || '0', 10);
      const s = parseInt(data.durationObj?.seconds || '0', 10);

      totalSeconds = h * 3600 + m * 60 + s;

      if (totalSeconds === 0) {
        return; // or show error
      }
    }

    // time 
    const now = new Date();
    const formatted = now.toISOString().slice(0, 19).replace('T', ' ');

    dispatch(addCallLog({
      duration: totalSeconds,
      type: data.type,
      lead_id: Number(selectedLead?.id),
      timestamp: formatted,
    }));

    setShowCallLogSheet(false);
  };


  const handlePress = (contact: any) => {
    router.push({
      pathname: '/lead/contact-details',
      params: { contact: JSON.stringify(contact) },
    });
  };

  // Simple local search
  const filteredLeads = leads.filter((lead: Lead) => {
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

  // status change
  const handleStatusChange = async (
    status: string
  ) => {

    if (!selectedLead) return;

    try {
      setIsUpdatingStatus(true);
      await dispatch(
        editLead({
          id: selectedLead.id,
          full_name: selectedLead.full_name || '',
          company_name: selectedLead.company_name || '',
          email: selectedLead.email || '',
          phone: selectedLead.phone || '',
          notes: selectedLead.notes || '',
          location: selectedLead.location || '',
          stage: status,
        })
      ).unwrap();

      setShowStatusModal(false);
      setSelectedLead(null);

    } catch (e) {
      console.log(
        'Status update error',
        e
      );

    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    if (!initialized) {
      dispatch(loadStatuses());
    }
  }, []);

  // call log thing
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active' &&
        callInitiatedRef.current
      ) {
        setShowCallLogSheet(true);

        // reset flag
        callInitiatedRef.current = false;
      }

      appState.current = nextState;
    });

    return () => sub.remove();
  }, []);

  const renderLeadItem = ({ item }: { item: Lead }) => {

    const statusColor =
      statuses.find(
        status => status.status === item.stage
      )?.color;

    return (
      <TouchableOpacity
        style={styles.leadCard}
        activeOpacity={0.88}
        onPress={() => handlePress(item)}
      >

        {/* AVATAR */}
        <Avatar
          item={item}
          height={54}
          width={54}
        />

        {/* CENTER */}
        <View style={styles.centerContent}>

          <Text
            style={styles.leadName}
            numberOfLines={1}
          >
            {item.full_name}
          </Text>

          {!!item.phone && (

            <Text style={styles.phoneText}>
              +91 {item.phone}
            </Text>
          )}

          {item.stage && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.badgeWrap}
              onPress={() => {
                setSelectedLead(item);
                setShowStatusModal(true);
              }}
            >
              <StageBadge
                stage={item.stage}
                color={statusColor}
              />
            </TouchableOpacity>
          )}

        </View>

        {/* RIGHT */}
        <View style={styles.rightContent}>

          {!!item.created_at && (

            <Text style={styles.timeText}>
              {timeAgo(item.created_at)}
            </Text>
          )}

          {!!item.phone && (
            <TouchableOpacity
              style={styles.callBtn}
              activeOpacity={0.75}
              onPress={() => {
                if (!item.phone) return;
                callInitiatedRef.current = true;
                Linking.openURL(
                  `tel:${item.phone}`
                );
                setSelectedLead(item);
              }
              }
            >

              <Phone
                size={18}
                color="#111827"
              />

            </TouchableOpacity>
          )}

        </View>

      </TouchableOpacity>
    );
  };
  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission not granted!');
    }
    const settings = await Notifications.getPermissionsAsync();
    // console.log(settings);
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topContainer}>

        {/* TOP BAR */}
        <View style={styles.topBar}>

          {/* LEFT */}
          <TouchableOpacity
            style={styles.circleIconBtn}
            onPress={() =>
              setShowAddModal(true)
            }
          >
            <Plus
              size={22}
              color="#111827"
            />
          </TouchableOpacity>

          {/* CENTER */}
          {!showSearch ? (

            <Text style={styles.screenTitle}>
              Leads
            </Text>

          ) : (

            <View style={styles.searchInlineWrap}>

              <Search
                size={18}
                color="#9CA3AF"
              />

              <TextInput
                autoFocus
                value={searchQuery}
                onChangeText={
                  handleSearchChange
                }
                placeholder="Search..."
                placeholderTextColor="#9CA3AF"
                style={styles.inlineSearchInput}
              />

            </View>
          )}

          {/* RIGHT */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {

              if (showSearch) {
                setSearchQuery('');
                dispatch(setSearch(''));
              }

              setShowSearch(
                !showSearch
              );
            }}
          >
            {!showSearch ?
              <Search
                size={21}
                color="#111827"
              /> :
              <X
                size={21}
                color="#111827"
              />
            }

          </TouchableOpacity>

        </View>

        {/* FILTERS */}
        <View style={styles.filterTabsWrap}>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >

            {[
              { status: 'All' },
              ...statuses
            ].map((item: any) => {

              const active =
                selectedStage === item.status;

              return (

                <TouchableOpacity
                  key={item.status}
                  style={styles.filterTab}
                  onPress={() =>
                    setSelectedStage(
                      item.status
                    )
                  }
                >

                  <Text
                    style={[
                      styles.filterTabText,
                      active &&
                      styles.filterTabTextActive
                    ]}
                  >
                    {item.status}
                  </Text>

                  {active && (
                    <View
                      style={styles.activeLine}
                    />
                  )}

                </TouchableOpacity>
              );
            })}

          </ScrollView>

        </View>

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
        STAGES={statuses?.map((status) => status.status)}
        onClose={() => { setShowAddModal(false); setSelectedLead(null); }}
      />

      {/* For change status */}
      <StatusPickerModal
        visible={showStatusModal}
        onClose={() =>
          setShowStatusModal(false)
        }
        statuses={statuses}
        currentStatus={selectedLead?.stage}
        loading={isUpdatingStatus}
        onSelect={handleStatusChange}
      />

      {/* Call log modal */}
      <CallLogModal
        visible={showCallLogSheet}
        onClose={() => setShowCallLogSheet(false)}
        onSubmit={handleSaveCallLog}
        defaultValues={defaultValues}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 100,
    gap: 2,
  },

  leadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 10,
    borderBottomColor: '#F1F5F9',
  },
  centerContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  leadName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  phoneText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  badgeWrap: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  rightContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    marginLeft: 10,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
  topContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },

  circleIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },

  searchInlineWrap: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 14,
    borderRadius: 999,
    paddingHorizontal: 14,
  },

  inlineSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
  },

  filterTabsWrap: {
    paddingHorizontal: 14,
  },

  filterTab: {
    paddingHorizontal: 10,
    paddingBottom: 12,
    marginRight: 18,
    alignItems: 'center',
  },

  filterTabText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  filterTabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  activeLine: {
    marginTop: 10,
    width: '100%',
    height: 3,
    borderRadius: 999,
    backgroundColor: '#2563EB',
  },
});