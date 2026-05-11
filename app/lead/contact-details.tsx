// ContactDetailScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '@/utils/avatar';
import { StageBadge } from '@/utils/stageBadge';
import ContactFormModal from '@/components/ContactFormModal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import LeadFollowUps from './LeadFollowUps';
import { editLead } from '@/store/slices/leadsSlice';
import StatusPickerModal from '@/components/StatusPickerModal';
import LeadNotes from './LeadNotes';
import LeadActivity from './LeadActivity';
import LeadTasks from './LeadTask';
import { AppState } from 'react-native';
import CallLogModal from '@/components/CallLogModal';
import { addCallLog, loadCallLogs } from '@/store/slices/callLogSlice';
import { useRouter } from 'expo-router';

type TabKey = 'Overview' | 'Follow-ups' | 'Notes' | 'Activity' | 'Tasks';
const TABS: TabKey[] = ['Overview', 'Follow-ups', 'Notes', 'Activity', 'Tasks'];
export type CallLogForm = {
  type: 'INCOMING' | 'OUTGOING' | 'MISSED';
  durationObj: {
    hours: string;
    minutes: string;
    seconds: string;
  };
};

// const SCORE_BREAKDOWN = [
//   { label: 'Engagement', value: 88, color: '#22c55e' },
//   { label: 'Fit', value: 85, color: '#22c55e' },
//   { label: 'Intent', value: 76, color: '#22c55e' },
//   { label: 'Demo', value: 72, color: '#22c55e' },
// ];

const ContactDetailScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const route = useRoute();
  const callInitiatedRef = useRef(false);
  const dispatch = useDispatch<any>();
  const [activeTab, setActiveTab] = React.useState<TabKey>('Overview');
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showStatusModal, setShowStatusModal] = React.useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [showCallLogSheet, setShowCallLogSheet] = React.useState<boolean>(false);
  const [callFilter, setCallFilter] = React.useState<'ALL' | 'INCOMING' | 'OUTGOING' | 'MISSED'>('ALL');
  const { statuses } = useSelector(
    (state: RootState) => state.contactStatus
  );
  const { logs: callLogs, loading: isCallLogLoading } = useSelector(
    (state: RootState) => state.callLogs
  );
  const appState = useRef(AppState.currentState);

  // default value for call log
  const defaultValues: CallLogForm = {
    type: "OUTGOING",
    durationObj: {
      hours: "",
      minutes: "",
      seconds: "",
    },
  }

  const contact = useSelector((state: RootState) => {
    const contactParam = JSON.parse((route.params as any)?.contact);
    return state.leads.leads.find(l => l?.id?.toString() === contactParam.id?.toString());
  });

  if (!contact) {
    return (
      <View style={styles.center}>
        <Text>No contact data found</Text>
      </View>
    );
  }

  // contact status
  const currentStatus = statuses.find(
    (s) => s.status === contact?.stage
  );

  // ─── Call Log Helpers ───────────────────────────────────────────────────────
  const getCallStyle = (type: string) => {
    switch (type) {
      case 'INCOMING': return { icon: 'call-outline', secondaryIcon: 'arrow-down-outline', color: '#22c55e', bg: '#dcfce7' };
      case 'OUTGOING': return { icon: 'call-outline', secondaryIcon: 'arrow-up-outline', color: '#3b82f6', bg: '#dbeafe' };
      case 'MISSED': return { icon: 'call-outline', secondaryIcon: 'close-outline', color: '#ef4444', bg: '#fee2e2' };
      default: return { icon: 'call-outline', color: '#888', bg: '#f3f4f6' };
    }
  };

  const formatDuration = (seconds: string) => {
    const sec = parseInt(seconds);
    if (!sec || sec === 0) return 'No answer';
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  const formatDate = (timestamp: string) => {
    const d = new Date(timestamp); // ✅ correct

    if (isNaN(d.getTime())) return "Invalid date";

    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();

    if (isToday) {
      return `Today, ${d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    return (
      d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  // update status
  const handleStatusChange = async (
    status: string
  ) => {

    try {
      setIsUpdatingStatus(true);
      await dispatch(
        editLead({
          id: contact.id,
          full_name: contact.full_name || '',
          company_name: contact.company_name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          notes: contact.notes || '',
          location: contact.location || '',
          stage: status,
        })
      ).unwrap();
      setShowStatusModal(false);

    } catch (e) {
      console.log(
        'Status update error',
        e
      );

    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // const requestCallLogPermission = async () => {
  //   if (Platform.OS !== 'android') return false;

  //   try {
  //     const granted = await PermissionsAndroid.request(
  //       PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
  //     );

  //     return granted === PermissionsAndroid.RESULTS.GRANTED;
  //   } catch (err) {
  //     console.warn(err);
  //     return false;
  //   }
  // };



  useEffect(() => {
    if (contact?.id) {
      dispatch(loadCallLogs({ lead_id: Number(contact.id) }));
    }
  }, [contact?.id]);

  const filteredLogs =
    callFilter === 'ALL' ? callLogs : callLogs.filter(l => l.type === callFilter);

  const totalDuration = callLogs.reduce(
    (sum, l) => sum + parseInt(l.duration?.toString() || '0'), 0,
  );
  const formatTotalDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;

    if (sec < 3600) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}m ${s}s`; // ✅ FIXED
    }

    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    return `${h}h ${m}m ${s}s`;
  };

  // google meet
  const openGoogleMeet = async () => {
    const url = 'https://meet.google.com/';

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log('Cannot open Meet');
    }
  };

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
      lead_id: Number(contact.id),
      timestamp: formatted,
    })).then(() => {
      dispatch(loadCallLogs({ lead_id: Number(contact.id) }))
    });

    setShowCallLogSheet(false);
  };

  // ─── Actions ────────────────────────────────────────────────────────────────

  const actions = [
    {
      label: 'Call', icon: 'call', bg: '#D6ECFF', text: '#1E88E5',
      onPress: async () => {
        const phone = contact.phone || '';
        if (!phone) return;

        // Open dialer
        callInitiatedRef.current = true;

        await Linking.openURL(`tel:${phone}`);
      }
    },
    {
      label: 'Email', icon: 'mail', bg: '#DFF7E3', text: '#2E7D32',
      onPress: () => {
        const sub = encodeURIComponent('Regarding Your Interior Requirements');
        const body = encodeURIComponent(`Hello ${contact.full_name || ''},\n\nI hope you're doing well.\n\nThis is from Decolivings. Thank you for showing interest in our services.\n\n`);
        Linking.openURL(`mailto:${contact.email || ''}?subject=${sub}&body=${body}`);
      },
    },
    {
      label: 'Meet', icon: 'calendar', bg: '#EDE7F6', text: '#5E35B1',
      onPress: openGoogleMeet
    },
    {
      label: 'Deal',
      icon: 'pricetag-outline',
      bg: '#FDECEA',
      text: '#E53935',
      onPress: () => {
        router.push({
          pathname: '/deal/create-deal',
          params: {
            lead: JSON.stringify(contact)
          }
        })
      }
    }
  ];

  // ─── Lead Score ─────────────────────────────────────────────────────────────

  const leadScore = 82; // Replace with contact.lead_score when available
  // const nextAction = contact.next_action || 'Call';
  // const nextActionDate = contact.next_action_date || 'Apr 16';

  // Score ring
  const circumference = 2 * Math.PI * 28;
  const progress = (leadScore / 100) * circumference;

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View style={styles.scoreBarRow}>
      <Text style={styles.scoreBarLabel}>{label}</Text>
      <View style={styles.scoreBarTrack}>
        <View style={[styles.scoreBarFill, { width: `${value}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.scoreBarValue}>{value}</Text>
    </View>
  );

  const CallFilterPill = ({
    label, type, count, color,
  }: { label: string; type: string; count: number; color: string }) => (
    <TouchableOpacity
      style={[styles.filterPill, callFilter === type && { backgroundColor: color + '18', borderColor: color }]}
      onPress={() => setCallFilter(type as any)}
    >
      <Text style={[styles.filterPillCount, { color: callFilter === type ? color : '#555' }]}>{count}</Text>
      <Text style={[styles.filterPillLabel, callFilter === type && { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  // ─── Tab Content ─────────────────────────────────────────────────────────────

  const renderOverview = () => {
    return (
      <FlatList<any>
        data={[]} // container list
        renderItem={() => null} // ✅ required for TS
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}

        ListHeaderComponent={
          <>
            {/* Contact Info */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Contact Info</Text>

              {contact ? (
                [
                  ['Email', contact.email],
                  ['Phone', '+91 ' + contact.phone],
                  ['Location', contact?.location],
                  ['Source', contact.source],
                ].map(([label, value], i, arr) => (
                  <View
                    key={i}
                    style={[
                      styles.infoRow,
                      i === arr.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{value || '-'}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No contact found</Text>
                </View>
              )}
            </View>

            {/* Notes */}
            {contact?.notes && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Additional Notes</Text>
                <Text>{contact.notes}</Text>
              </View>
            )}

            {/* Call History */}
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.callHistoryHeader}>
                <Text style={styles.sectionTitle}>Call History</Text>


                {/* Mandually add call log */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => { setShowCallLogSheet(true) }}>
                    <Ionicons name="add" size={18} color="#6366f1" />
                  </TouchableOpacity>
                  {!isCallLogLoading && callLogs.length > 0 && (
                    <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
                      <Text style={[styles.badgeText, { color: '#3b82f6' }]}>
                        {callLogs.length} calls · {formatTotalDuration(totalDuration)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Filters */}
              <View style={styles.filterRow}>
                <CallFilterPill label="All" type="ALL" count={callLogs.length} color="#6366f1" />
                <CallFilterPill label="Incoming" type="INCOMING" count={callLogs.filter(l => l.type === 'INCOMING').length} color="#22c55e" />
                <CallFilterPill label="Outgoing" type="OUTGOING" count={callLogs.filter(l => l.type === 'OUTGOING').length} color="#3b82f6" />
                <CallFilterPill label="Missed" type="MISSED" count={callLogs.filter(l => l.type === 'MISSED').length} color="#ef4444" />
              </View>

              {/* 🔥 LOADER */}
              {isCallLogLoading ? (
                <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 20 }} />
              ) : filteredLogs.length === 0 ? (
                // 🔥 EMPTY STATE
                <View style={styles.emptyWrap}>
                  <Ionicons name="call-outline" size={36} color="#ddd" />
                  <Text style={styles.emptyText}>No calls found</Text>
                </View>
              ) : (
                // 🔥 LIST
                <FlatList
                  data={filteredLogs}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  renderItem={({ item, index }) => {
                    const s = getCallStyle(item.type);

                    return (
                      <View style={[styles.logRow, index === 0 && { borderTopWidth: 0 }]}>
                        <View style={[styles.logIconWrap, { backgroundColor: s.bg }]}>
                          <Ionicons name={s.icon as any} size={15} color={s.color} />
                        </View>

                        <View style={styles.logMeta}>
                          <Text style={[styles.logType, { color: s.color }]}>
                            {item.type}
                          </Text>
                          <Text style={styles.logDate}>
                            {formatDate(item.created_at)}
                          </Text>
                        </View>

                        <View style={styles.logRight}>
                          <Text style={styles.logDur}>
                            {formatDuration(item.duration?.toString())}
                          </Text>
                        </View>
                      </View>
                    );
                  }}
                />
              )}
            </View>
          </>
        }
      />
    );
  };

  const renderEmptyTab = (label: string) => (
    <View style={styles.emptyTab}>
      <Ionicons name="document-outline" size={40} color="#ddd" />
      <Text style={styles.emptyTabText}>No {label.toLowerCase()} yet</Text>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverview();
      case 'Follow-ups': return <LeadFollowUps lead={contact} />;
      case 'Notes': return <LeadNotes lead={contact} />;
      case 'Activity': return <LeadActivity lead={contact} />;
      case 'Tasks': return <LeadTasks lead={{ ...contact, id: Number(contact.id) }} />;
    }
  };

  // ─── Main render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.editBtn}>
          <Ionicons name="create-outline" size={16} color="#007AFF" />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Profile hero */}
      <View style={styles.hero}>
        <Avatar item={contact} height={52} width={52} />
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{contact.full_name}</Text>
          <View style={styles.heroTags}>
            {contact?.stage && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  setShowStatusModal(true)
                }
              >
                <StageBadge
                  stage={contact.stage}
                  color={currentStatus?.color}
                  size={4}
                />
              </TouchableOpacity>
            )}
          </View>
          {/* <View style={[styles.badge, { backgroundColor: '#fee2e2', marginLeft: 6 }]}>
              <Text style={[styles.badgeText, { color: '#ef4444' }]}>Hot</Text>
            </View> */}
          {contact?.company &&
            <Text style={styles.heroSub}>
              {contact.job_title}{contact.company_name ? ` · ${contact.company_name}` : ''}
            </Text>
          }
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        {actions.map((item, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>

            <TouchableOpacity
              onPress={item.onPress}
              activeOpacity={0.75}
              style={[
                styles.actionBtn,
                { backgroundColor: item.bg }
              ]}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.text}
              />
            </TouchableOpacity>

            <Text style={[styles.actionText, { color: item.text }]}>
              {item.label}
            </Text>

          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={{ flex: 1, minHeight: 0 }}>
        {renderTabContent()}
      </View>

      {/* Edit Modal */}
      <ContactFormModal
        visible={showEditModal}
        mode="edit"
        defaultValues={contact}
        STAGES={statuses?.map((status) => status.status)}
        onClose={() => setShowEditModal(false)}
      />

      {/* Task Sheet */}
      {/* <TaskBottomSheet
        open={showTaskSheet}
        onClose={() => setShowTaskSheet(false)}
        contact={contact}
        onSave={(data) => console.log('Saved:', data)}
      /> */}

      {/* For change status */}
      <StatusPickerModal
        visible={showStatusModal}
        onClose={() =>
          setShowStatusModal(false)
        }
        statuses={statuses}
        currentStatus={contact.stage}
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

    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#007AFF', fontSize: 16, marginLeft: 2 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EAF2FF', paddingVertical: 5,
    paddingHorizontal: 12, borderRadius: 20,
  },
  editText: { color: '#007AFF', fontSize: 13, fontWeight: '600', marginLeft: 4 },

  // Hero
  hero: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
  },
  heroInfo: { marginLeft: 12, flex: 1 },
  heroName: { fontSize: 18, fontWeight: '700', color: '#111' },
  heroSub: { fontSize: 12, color: '#888', marginTop: 1 },
  heroTags: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Actions
  actionRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24, // perfect circle
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  actionText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#ebebeb',
    paddingHorizontal: 4,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabLabel: { fontSize: 13, color: '#999', fontWeight: '500' },
  tabLabelActive: { color: '#007AFF', fontWeight: '700' },
  tabUnderline: {
    position: 'absolute', bottom: 0,
    height: 2, width: '80%', backgroundColor: '#007AFF', borderRadius: 1,
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 14, marginTop: 14,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },

  // Lead Score card
  scoreCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 14, marginTop: 14,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  scoreLeft: { flex: 1, alignItems: 'center' },
  scoreRight: { flex: 1, paddingLeft: 16 },
  scoreDivider: { width: 1, height: 80, backgroundColor: '#f0f0f0' },
  scoreCardLabel: { fontSize: 11, color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },

  ringWrap: { width: 72, height: 72, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  ringScore: { fontSize: 22, fontWeight: '800', color: '#111' },

  nextActionDate: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 2 },
  nextActionLabel: { fontSize: 13, color: '#666' },

  // Score breakdown
  scoreBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  scoreBarLabel: { width: 80, fontSize: 13, color: '#555' },
  scoreBarTrack: {
    flex: 1, height: 6, backgroundColor: '#f0f0f0',
    borderRadius: 3, overflow: 'hidden', marginHorizontal: 8,
  },
  scoreBarFill: { height: '100%', borderRadius: 3 },
  scoreBarValue: { width: 26, fontSize: 12, fontWeight: '700', color: '#555', textAlign: 'right' },

  // Info rows
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111', maxWidth: '60%', textAlign: 'right' },

  // Call history
  callHistoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },

  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  filterPill: {
    flex: 1, alignItems: 'center', paddingVertical: 7,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#eee', backgroundColor: '#fafafa',
  },
  filterPillCount: { fontSize: 14, fontWeight: '800' },
  filterPillLabel: { fontSize: 10, color: '#aaa', marginTop: 1, fontWeight: '600' },

  logRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#f5f5f5',
  },
  logIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  logMeta: { flex: 1 },
  logType: { fontSize: 12, fontWeight: '700' },
  logDate: { fontSize: 11, color: '#aaa', marginTop: 2 },
  logRight: { alignItems: 'flex-end', minWidth: 56 },
  logDur: { fontSize: 12, fontWeight: '600', color: '#333' },
  durBar: {
    height: 3, width: 44, backgroundColor: '#f0f0f0',
    borderRadius: 2, marginTop: 4, overflow: 'hidden',
  },
  durFill: { height: '100%', borderRadius: 2 },

  emptyWrap: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 14, color: '#ccc', marginTop: 8 },

  emptyTab: { alignItems: 'center', marginTop: 60 },
  emptyTabText: { fontSize: 15, color: '#ccc', marginTop: 10 },

  // call log form
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },



  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  iconBtn: {
    width: 28,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

});

export default ContactDetailScreen;