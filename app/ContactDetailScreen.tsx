// ContactDetailScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '@/utils/avatar';
import { StageBadge } from '@/utils/stageBadge';
import ContactFormModal from '@/components/ContactFormModal';
import { STAGES } from '@/constants/constant';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

type ContactData = {
  id: string;
  full_name: string;
  title: string;
  stage: string;
  company?: string;
  email: string;
  phone: string;
  location: string;
  source: string;
  dealValue: number;
  dealName: string;
  closeDate: string;
  probability: number;
  notes?: string;
  timeline: Array<{
    id: number;
    type: 'proposal' | 'demo';
    title: string;
    subtitle: string;
    date: string;
    icon: 'mail' | 'call';
  }>;
};

const ContactDetailScreen = () => {
  const navigation = useNavigation();
  const [showEditModal, setShowEditModal] = React.useState(false);
  const route = useRoute();

  // Data coming from previous screen via navigation
  const contact = useSelector((state: RootState) => {
    const contactParam = JSON.parse(route.params?.contact);
    return state.leads.leads.find(l => l?.id?.toString() === contactParam.id?.toString());
});

if (!contact) {
  return (
    <View style={styles.center}>
      <Text>No contact data found</Text>
    </View>
  );
}

const actions = [
  {
    label: 'Call',
    bg: '#D6ECFF',
    text: '#1E88E5',
    onPress: () => Linking.openURL(contact.phone ? `tel:${contact.phone}` : 'tel:'),
  },
  {
    label: 'Email',
    bg: '#DFF7E3',
    text: '#2E7D32',
    onPress: () =>
      Linking.openURL(contact.email ? `mailto:${contact.email}?subject=Hello&body=Hi there` : 'mailto:'),
  },
  {
    label: 'Note',
    bg: '#FFE8D6',
    text: '#EF6C00',
    onPress: () => console.log('Open Notes Screen'),
  },
  // {
  //   label: 'Task',
  //   bg: '#E8DDFF',
  //   text: '#6A1B9A',
  //   onPress: () => console.log('Open Task Screen'),
  // },
];

return (
  <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor="#fff" />

    {/* Header */}
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="#007AFF" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>{contact.full_name}</Text>

      <TouchableOpacity
        onPress={() => { setShowEditModal(true); }}
        style={styles.editButton}
      >
        <Ionicons name="create-outline" size={18} color="#007AFF" />
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>
    </View>

    <ScrollView showsVerticalScrollIndicator={false}>

      {/* PROFILE CARD */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <Avatar item={contact} height={60} width={60} />

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{contact.full_name}</Text>
            {contact?.stage &&
              <StageBadge stage={contact.stage} size={4} />
            }
            {contact?.company &&
              <Text style={styles.subtitle}>
                {contact.title} • {contact.company}
              </Text>
            }
          </View>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.card}>
        <View style={styles.actionRow}>
          {actions.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={item.onPress}
              style={[
                styles.actionBtn,
                { backgroundColor: item.bg }
              ]}
            >
              <Text style={[styles.actionText, { color: item.text }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* CONTACT INFO */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact info</Text>

        {[
          ['Email', contact.email],
          ['Phone', "+91 " + contact.phone],
          ['Location', contact.location],
          ['Source', contact.source],
        ].map(([label, value], i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Note */}
      {contact.notes ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Note</Text>
          <Text style={styles.value}>{contact.notes}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Note</Text>
          <Text style={[styles.value, { color: '#999' }]}>No notes added</Text>
        </View>
      )}

      {/* ACTIVE DEAL */}
      {/* <View style={styles.card}>
          <Text style={styles.sectionTitle}>Active deal</Text>

          <Text style={styles.dealTitle}>{contact.dealName}</Text>

          <View >
            <Text style={styles.badgeText}>Negotiation</Text>
          </View>

          <Text style={styles.valueText}>
            Value: <Text style={styles.bold}>${contact.dealValue}</Text>
          </Text>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${contact.probability}%` }]} />
          </View>

          <Text style={styles.probText}>
            {contact.probability}% probability
          </Text>

          <Text  >
            Close: <Text style={styles.bold}>{contact.closeDate}</Text>
          </Text>
        </View> */}

      {/* TIMELINE */}
      {/* <View style={styles.card}>
          <Text style={styles.sectionTitle}>Timeline</Text>

          {contact.timeline?.map((t, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={styles.iconBox}>
                <Ionicons
                  name={t.icon === 'mail' ? 'mail-outline' : 'call-outline'}
                  size={18}
                  color="#007AFF"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>{t.title}</Text>
                <Text style={styles.timelineSub}>{t.subtitle}</Text>
              </View>

              <Text style={styles.timelineDate}>{t.date}</Text>
            </View>
          ))}
        </View> */}

      {/* Edit Modal */}
      <ContactFormModal
        visible={showEditModal}
        mode="edit"
        defaultValues={contact}
        STAGES={STAGES}
        onClose={() => setShowEditModal(false)}
      />

    </ScrollView>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#007AFF',
    fontSize: 17,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  actionButtonText: {
    fontWeight: '600',
    color: '#333',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    color: '#666',
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
  },
  dealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  negotiateTag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  negotiateText: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '600',
  },
  valueLabel: {
    fontSize: 15,
    marginBottom: 8,
  },

  progressContainer: {
    marginVertical: 12,
  },

  probabilityText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  closeDate: {
    fontSize: 15,
    color: '#666',
  },
  date: {
    fontWeight: '600',
    color: '#000',
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },

  timelineSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  badge: {
    marginTop: 6,
    backgroundColor: '#FFF3E0',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  actionText: {
    fontWeight: '600',
    color: '#333',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  label: {
    color: '#666',
  },

  value: {
    fontWeight: '600',
    // color: '#007AFF',
  },

  dealTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },

  valueText: {
    marginTop: 8,
  },

  bold: {
    fontWeight: '700',
  },

  progressBar: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginTop: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
  },

  probText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },

  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  timelineTitle: {
    fontWeight: '600',
  },

  timelineSub: {
    fontSize: 12,
    color: '#666',
  },

  timelineDate: {
    fontSize: 12,
    color: '#666',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  editText: {
    marginLeft: 6,
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default ContactDetailScreen;