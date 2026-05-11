import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  Users, TrendingUp, FileText, UserPlus, ClipboardList, Trophy, Handbag,
  CheckCircle2,
  Clock3,
  Target,
  Circle,
  Handshake
} from 'lucide-react-native';
import { fetchDashboardSummary } from '@/store/slices/dashboardSlice';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { editTask, ITask } from '@/store/slices/taskSlice';
import TaskList from '@/components/TaskList';
import { formatAmount } from '@/utils/amount_format';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

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
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data, loading } = useSelector((state: RootState) => state.dashboard);

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


  const stats = [
    {
      title: 'Total Leads',
      value: data?.total_leads?.toString(),
      // change: '+18%',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      icon: Users,
    },
    {
      title: 'Total Products',
      value: data?.total_products?.toString() ?? '0',
      // change: '+12%',
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
      icon: Handbag,
    },
    {
      title: 'Total Deals',
      value: data?.total_deals?.toString() ?? '0',
      // change: '+20%',
      color: '#10B981',
      bgColor: '#ECFDF5',
      icon: Handshake,
    },
    {
      title: 'Revenue',
      value: `${data?.total_revenue ? formatAmount(Number(data?.total_revenue)) : 0}`,
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
          priority: Number(task.priority?.id),
          notes: task.notes,
        },
      })).unwrap();

      dispatch(fetchDashboardSummary());

    } catch (error) {
      console.log('Update failed', error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.topArea}>
        <Text style={styles.welcomeTitle}>
          Welcome back, {user?.first_name} 👋
        </Text>

        <Text style={styles.welcomeSubtitle}>
          Here's what's happening with your business
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}> 
        {loading || !data?.total_leads 
          ? Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={styles.metricTop}>
                <View>
                  <MotiView
                    from={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      loop: true,
                      type: 'timing',
                      duration: 800,
                    }}
                    style={styles.skeletonValue}
                  />

                  <MotiView
                    from={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      loop: true,
                      type: 'timing',
                      duration: 800,
                      delay: 100,
                    }}
                    style={styles.skeletonLabel}
                  />
                </View>

                <MotiView
                  from={{ opacity: 0.3 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    loop: true,
                    type: 'timing',
                    duration: 800,
                  }}
                  style={styles.skeletonIcon}
                />
              </View>
            </View>
          ))
          : stats.map((item, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={styles.metricTop}>
                <View>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: item.color },
                    ]}
                  >
                    {item.value}
                  </Text>

                  <Text style={styles.metricLabel}>
                    {item.title}
                  </Text>
                </View>

                <View
                  style={[
                    styles.metricIconWrap,
                    { backgroundColor: item.bgColor },
                  ]}
                >
                  <item.icon
                    size={18}
                    color={item.color}
                  />
                </View>
              </View>
            </View>
          ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>
        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickCard}
              onPress={() => router.push(action.screen)}
            >
              <View
                style={[
                  styles.quickIcon,
                  { backgroundColor: action.color + '15' },
                ]}
              >
                <action.icon
                  size={18}
                  color={action.color}
                />
              </View>

              <Text style={styles.quickText}>
                {action.title}
              </Text>

            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pipeline */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Pipeline Overview
          </Text>

          {/* <Text style={styles.sectionFilter}>
            This Month
          </Text> */}
        </View>

        <View style={styles.pipelineCard}>
          {data?.pipeline_overview?.map((stage: any, index: number) => {
            const isLast =
              index === data.pipeline_overview.length - 1;

            const StageIcon =
              stage.name === 'Won'
                ? CheckCircle2
                : stage.name === 'Negotiation'
                  ? Clock3
                  : stage.name === 'Proposal'
                    ? Target
                    : Circle;

            return (
              <View
                key={stage.id}
                style={[
                  styles.pipelineRow,
                  !isLast && styles.pipelineBorder,
                ]}
              >
                {/* Left */}
                <View style={styles.pipelineLeft}>
                  <View
                    style={[
                      styles.pipelineIconWrap,
                      {
                        backgroundColor: `${stage.color}15`,
                      },
                    ]}
                  >
                    <StageIcon
                      size={14}
                      color={stage.color}
                    />
                  </View>

                  <Text style={styles.pipelineName}>
                    {stage.name}
                  </Text>
                </View>

                {/* Center */}
                <View style={styles.pipelineCenter}>
                  <Text numberOfLines={1} style={styles.pipelineDeals}>
                    {stage.total_deals} Deals
                  </Text>
                </View>

                {/* Right */}
                <Text style={styles.pipelineRevenue}>
                  {formatAmount(Number(stage.total_revenue))}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Recent Tasks */}
      <View style={[styles.section, { marginBottom: 15 }]}>
        <TaskList
          loading={loading as boolean}
          tasks={data?.recent_tasks || []}
          toggleComplete={toggleComplete}
          isDashboard={true}
        />
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}


function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning!';
  if (hour < 18) return 'Good afternoon!';
  return 'Good evening!';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  topArea: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.6,
  },

  welcomeSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
  },

  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    height: 100,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
  },

  metricLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  metricGrowth: {
    marginTop: 10,
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
  },

  metricIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  sectionFilter: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  quickCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',

    alignItems: 'center',

    paddingVertical: 18,
  },

  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  quickText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },

  quickGrowth: {
    marginTop: 8,
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },

  pipelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,

    elevation: 2,
  },

  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 18,
    paddingHorizontal: 16,
  },

  pipelineBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  pipelineLeft: {
    flexDirection: 'row',
    alignItems: 'center',

    flex: 1,
  },

  pipelineDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    marginRight: 10,
  },

  pipelineIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 10,
  },

  pipelineName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  pipelineCenter: {
    width: 90,
    alignItems: 'center',
  },
  pipelineDeals: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  pipelineRevenue: {
    width: 70,
    textAlign: 'right',

    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  // skeleton loader
  skeletonValue: {
    width: 80,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },

  skeletonLabel: {
    width: 60,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginTop: 10,
  },

  skeletonIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
});
