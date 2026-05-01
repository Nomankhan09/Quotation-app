import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  InteractionManager,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { RootState } from "@/store";
import { getQuotations, setSearch, clearQuotations } from "@/store/slices/quotationsSlice";
import { Quotation } from "@/store/slices/quotationsSlice";
import { router } from "expo-router";
import {
  Plus,
  IndianRupee,
  Package,
  Search,
  FileText,
  Clock,
  TrendingUp,
  ChevronRight,
} from "lucide-react-native";
import { resetForNewQuotation } from "@/store/slices/quotationBuilderSlice";
import Avatar from "@/utils/avatar";

export default function QuotationsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { quotations, loading, loadingMore, search, pagination } = useSelector((state: RootState) => state.quotations);
  const { leads } = useSelector((state: RootState) => state.leads);
  const { products } = useSelector((state: RootState) => state.products);
  const [searchQuery, setSearchQuery] = useState(search);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== search) {
        dispatch(setSearch(searchQuery));
        dispatch(clearQuotations());
        dispatch(getQuotations({ page: 1, search: searchQuery }));
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, search, dispatch]);

  // Initial load
  useEffect(() => {
    dispatch(getQuotations({ page: 1, search: searchQuery }));
  }, [dispatch]);

  const getLeadName = (leadId: string) => {
    return leads.find((lead) => lead.id == leadId)?.full_name || "Unknown Lead";
  };

  const getProductNames = (productIds: string[]) => {
    return productIds
      .map((id) => products.find((p) => p.id == id)?.product_name)
      .filter(Boolean)
      .join(", ");
  };

  const getStatusConfig = (status: Quotation["status"]) => {
    switch (status) {
      case "draft":
        return { color: "#64748B", bg: "#F1F5F9", label: "Draft" };
      case "sent":
        return { color: "#3B82F6", bg: "#DBEAFE", label: "Sent" };
      case "accepted":
        return { color: "#10B981", bg: "#D1FAE5", label: "Accepted" };
      case "rejected":
        return { color: "#EF4444", bg: "#FEE2E2", label: "Rejected" };
      default:
        return { color: "#64748B", bg: "#F1F5F9", label: "Unknown" };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && pagination.hasMorePages) {
      const nextPage = pagination.currentPage + 1;
      dispatch(getQuotations({ page: nextPage, search: searchQuery, loadMore: true }));
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  const renderQuotationItem = ({ item }: { item: Quotation }) => {
    const statusConfig = getStatusConfig(item.status);
    const lead = leads.find((lead) => Number(lead.id) === Number(item.leadId));

    return (
      <TouchableOpacity
        style={styles.quotationCard}
        onPress={() => router.push(`/quotation/edit/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.quotationInfo}>
            <Text style={styles.quotationNumber}>#{item.quotationNumber}</Text>
            <View style={styles.quotationMeta}>
              <Clock size={12} color="#94A3B8" />
              <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.clientSection}>
          {/* <View style={styles.clientIcon}> */}
          {/* <User size={18} color="#3B82F6" /> */}
          <Avatar height={45} width={45} item={lead} />
          {/* </View> */}
          <View style={styles.clientInfo}>
            <Text style={styles.clientLabel}>Client</Text>
            <Text style={styles.clientName}>{getLeadName(item.leadId)}</Text>
          </View>
        </View>

        {/* Products */}
        {item.productIds.length > 0 && (
          <View style={styles.productsSection}>
            <View style={styles.productsBadge}>
              <Package size={14} color="#64748B" />
              <Text style={styles.productsCount}>
                {item.productIds.length} item{item.productIds.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.productsPreview} numberOfLines={1}>
              {getProductNames(item.productIds)}
            </Text>
          </View>
        )}

        {/* Amount & Action */}
        <View style={styles.cardFooter}>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <View style={styles.amountValue}>
              <IndianRupee size={18} color="#10B981" />
              <Text style={styles.amountText}>
                {item.totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.viewAction}>
            <Text style={styles.viewActionText}>View</Text>
            <ChevronRight size={16} color="#3B82F6" />
          </View>
        </View>

        {/* Notes (if exists) */}
        {item.notes && (
          <View style={styles.notesContainer}>
            <FileText size={12} color="#64748B" />
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && quotations.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading quotations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Quotations</Text>
            <View style={styles.statsRow}>
              {/* <View style={styles.statBadge}>
                <FileText size={14} color="#3B82F6" />
                <Text style={styles.statText}>
                  {quotations.length} total
                </Text>
              </View> */}
              {quotations.filter(q => q.status === 'accepted').length > 0 && (
                <View style={[styles.statBadge, styles.statBadgeSuccess]}>
                  <TrendingUp size={14} color="#10B981" />
                  <Text style={[styles.statText, styles.statTextSuccess]}>
                    {quotations.filter(q => q.status === 'accepted').length} accepted
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              router.push("/quotation/create");
              // InteractionManager.runAfterInteractions(() => {
              //   dispatch(resetForNewQuotation());
              // });
            }}
            activeOpacity={0.8}
          >
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search quotations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#CBD5E1"
          />
        </View>

        {/* Filter button - placeholder for future functionality */}
        {/* <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
          <Filter size={20} color="#64748B" />
        </TouchableOpacity> */}
      </View>

      {/* Quotations List */}
      <FlatList
        key={searchQuery}
        data={quotations}
        renderItem={renderQuotationItem}
        keyExtractor={(item, idx) => `${item.id}-${idx}`}
        contentContainerStyle={[
          styles.listContainer,
          quotations.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        removeClippedSubviews={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <FileText size={56} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? "No quotations found" : "No quotations yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Create your first quotation to get started"}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => {
                    dispatch(resetForNewQuotation());
                    router.push("/quotation/create");
                  }}
                  activeOpacity={0.8}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.emptyButtonText}>Create Quotation</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 8,
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
  },
  statBadgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
  },
  statTextSuccess: {
    color: '#10B981',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 26,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  // Search Section
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 1,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },

  // List
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Quotation Card
  quotationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  quotationInfo: {
    flex: 1,
  },
  quotationNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  quotationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Client Section
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  clientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  clientLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Products Section
  productsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  productsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  productsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productsPreview: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountSection: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  amountValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -0.3,
  },
  viewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  viewActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },

  // Notes
  notesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 18,
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 32,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Footer Loader
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
});