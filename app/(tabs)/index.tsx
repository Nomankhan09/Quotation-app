import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  Users, Package, TrendingUp, IndianRupee, FileText, Tags, UserPlus, ClipboardList,
  Trophy
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchDashboardSummary } from '@/store/slices/dashboardSlice';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { editTask, ITask } from '@/store/slices/taskSlice';
import TaskList from '@/components/TaskList';

const { width } = Dimensions.get('window');
const cardWidth = (width - 64) / 2;

type RoutePath =
  | '/(tabs)/quotations'
  | '/(tabs)/leads'
  | '/specifications';

type QuickAction = {
  title: string;
  color: string;
  screen: RoutePath;
  icon: any;
};


export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { total_leads, total_products, total_categories, recent_leads, total_conversions,
    recent_tasks, loading
  } = useSelector((state: RootState) => state.dashboard);

  // Notification permission
  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission for notifications not granted!');
    }
  };


  useEffect(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  useEffect(() => {
    requestPermissions();
  }, [])

  // useEffect(() => {
  //   const init = async () => {
  //     const crashlytics = (await import('@react-native-firebase/crashlytics')).default;

  //     crashlytics().log('App started');
  //   };

  //   init();
  // }, []);

  // useEffect(() => {
  //   const now = new Date().toISOString();
  // }, []);

  const stats = [
    {
      title: 'Total Leads',
      value: total_leads.toString(),
      // change: '+18%',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      icon: Users,
    },
    {
      title: 'Products',
      value: total_products.toString(),
      // change: '+12%',
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
      icon: Package,
    },
    {
      title: 'Categories',
      value: total_categories.toString(),
      // change: '+20%',
      color: '#10B981',
      bgColor: '#ECFDF5',
      icon: Tags,
    },
    {
      title: 'Conversions',
      value: total_conversions.toString(),
      color: '#F97316',
      bgColor: '#FFF7ED',
      icon: TrendingUp,
      // change: '+2%',
    },
  ];

  const quickActions: QuickAction[] = [
    { title: 'Create Quote', color: '#3B82F6', screen: '/(tabs)/quotations', icon: FileText },
    { title: 'Add Contact', color: '#10B981', screen: '/(tabs)/leads', icon: UserPlus },
    { title: 'Add Specification', color: '#8B5CF6', screen: '/specifications', icon: ClipboardList },
  ];

  // task toggle
  const toggleComplete = (task: ITask) => {

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      dispatch(editTask({
        id: String(task.id),
        data: {
          contact_id: task.contact_id,
          title: task.title,
          status: newStatus,
          due_date: task.due_date,
          priority: task.priority,
          notes: task.notes,
        },
      })).unwrap();

      dispatch(fetchDashboardSummary());

    } catch (error) {
      console.log('Update failed', error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.first_name + ' ' + user?.last_name || 'User'}</Text>
          </View>
          <View style={styles.headerStats}>
            <IndianRupee color="#FFFFFF" size={24} />
          </View>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>

            {/* Top Row */}
            <View style={styles.statTop}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>

              <View style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
                <stat.icon color={stat.color} size={18} />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.statTitle}>{stat.title}</Text>

            {/* Growth */}
            {/* {stat.change &&
              <Text style={[styles.statChange, { color: '#16A34A' }]}>
                ↑ {stat.change}
              </Text>
            } */}

          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionCard}
              onPress={() => router.push(action.screen)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                <action.icon color={action.color} size={20} />
              </View>
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Leads */}
      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Contacts</Text>
        <View style={styles.recentLeads}>
          {recent_leads.map((lead) => (
            <TouchableOpacity key={lead.id} style={styles.leadCard}>
              <View style={styles.leadInfo}>
                <Text style={styles.leadName}>{lead.name}</Text>
                <Text style={styles.leadCompany}>{lead.company}</Text>
                <Text style={styles.leadEmail}>{lead.email}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View> */}

      {/* Recent Tasks */}
      <View style={[styles.section, { marginBottom: 15 }]}>
        <TaskList
          loading={loading as boolean}
          tasks={recent_tasks}
          toggleComplete={toggleComplete}
          isDashboard={true}
        />
      </View>
    </ScrollView>
  );
}


function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning!';
  if (hour < 18) return 'Good afternoon!';
  return 'Good evening!';
}

// function getStatusColor(status: string) {
//   switch (status) {
//     case 'new': return '#EFF6FF';
//     case 'contacted': return '#FFFBEB';
//     case 'qualified': return '#F0F9FF';
//     case 'converted': return '#ECFDF5';
//     default: return '#F1F5F9';
//   }
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#BFDBFE',
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerStats: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    // color: '#0f172a',
  },

  statTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },

  statChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 100) / 2,
    marginHorizontal: 8,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  recentLeads: {
    gap: 12,
    marginBottom: 15
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    marginBottom: 2,
  },
  leadEmail: {
    fontSize: 12,
    color: '#94A3B8',
  },
  leadStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leadStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
});

// import InvoiceListScreen from '@/src/ui/screens/InvoiceListScreen';

// export default function Home() {
//   return <InvoiceListScreen />;
// }
