import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { router, useLocalSearchParams } from 'expo-router';
import { fetchQuotationById } from '@/services/quotationService';
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  User, 
  Package, 
  IndianRupee, 
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Tag,
  CreditCard,
  FileCheck,
  Briefcase,
  Mail,
  Phone,
  X,
} from 'lucide-react-native';
import { generateQuotationHTML } from '@/services/pdfService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { 
  setEditMode, 
  setSelectedLead, 
  setSelectedProducts, 
  setDiscount, 
  setTerms, 
  setPaymentTerms,
  // setCurrentStep 
} from '@/store/slices/quotationBuilderSlice';
import { WebView } from 'react-native-webview';

interface QuotationDetails {
  id: string;
  quotationNumber: string;
  leadId: string;
  products: any[];
  totalAmount: number;
  subtotal: number;
  discount: {
    type: 'percent' | 'fixed';
    value: number;
  };
  discountAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil: string;
  created_at: string;
  notes?: string;
  terms: string[];
  paymentTerms: any[];
}

export default function QuotationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { leads } = useSelector((state: RootState) => state.leads);
  const { user } = useSelector((state: RootState) => state.auth);
  const token = useSelector((state: RootState) => state.auth.token);
  
  const allTerms = useSelector((state: RootState) => state.quotationBuilder.terms);
  const allPaymentTerms = useSelector((state: RootState) => state.quotationBuilder.paymentTerms);
  
  const dispatch = useDispatch();
  const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const [showPreview, setShowPreview] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string | null>(null);


  useEffect(() => {
    loadQuotationDetails();
  }, [id]);

  const loadQuotationDetails = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await fetchQuotationById(Number(id), token);
      setQuotation(response.quotation || response);
    } catch (error) {
      Alert.alert('Error', 'Failed to load quotation details');
    } finally {
      setLoading(false);
    }
  };

 const handlePreview = () => {
  if (!quotation || !lead) {
    Alert.alert('Error', 'Quotation data missing');
    return;
  }

  const quotationData = {
    user,
    quotationNumber: quotation.quotationNumber,
    lead,
    products: quotation.products,
    subtotal: quotation.subtotal,
    discount: quotation.discount,
    discountAmount: quotation.discountAmount,
    totalAmount: quotation.totalAmount,
    terms: quotation.terms || [],
    paymentTerms: quotation.paymentTerms || [],
    created_at: quotation.created_at,
  };

  const html = generateQuotationHTML(quotationData);

  router.push({
    pathname: '/quotation/create/html-preview',
    params: { html },
  });
};



  const handleEdit = () => {
    if (!quotation) return;
    
    try {
      dispatch(setSelectedLead(quotation.leadId));
      const normalizedProducts = quotation.products.map((p: any) => ({
        ...p,
        lineItemId: p.lineItemId ?? `${Date.now()}-${Math.random()}`
      }));
      dispatch(setSelectedProducts(normalizedProducts));
      dispatch(setDiscount({
        type: quotation.discount.type === 'percent' ? 'percentage' : 'fixed',
        value: quotation.discount.value
      }));
      
      if (quotation.terms && quotation.terms.length > 0) {
        const termIds = allTerms
          .filter(t => quotation.terms?.includes(t.text))
          .map(t => t.id);
        
        if (termIds.length > 0) {
          dispatch(setTerms(termIds));
        }
      }
      
      if (quotation.paymentTerms && quotation.paymentTerms.length > 0) {
        const paymentTermIds = quotation.paymentTerms
          .map(pt => {
            const matchingTerm = allPaymentTerms.find(
              apt => apt.description === pt.description && apt.value === pt.value
            );
            return matchingTerm ? matchingTerm.id : pt.id;
          })
          .filter(Boolean);
        
        if (paymentTermIds.length > 0) {
          dispatch(setPaymentTerms(paymentTermIds));
        }
      }
      
      dispatch(setEditMode({ 
        isEditMode: true, 
        quotationId: quotation.id,
        prefillData: quotation,
        // currentStep: 'select-lead'
      }));
      
      router.push('/quotation/create');
    } catch (error) {
      console.error('Error setting up edit mode:', error);
      Alert.alert('Error', 'Failed to open quotation for editing');
    }
  };

  const handleCreatePDF = async () => {
    if (!quotation || !lead) return;
    
    try {
      Alert.alert('Generating PDF', 'Please wait...');

      const pdfData = {
        user: user,
        quotationNumber: quotation.quotationNumber,
        lead: {
          full_name: lead.full_name,
          company_name: lead.company_name,
          email: lead.email,
          phone: lead.phone,
          address: 'N/A',
          city: 'N/A',
        },
        products: quotation.products.map((product, index) => ({
          productId: product.productId,
          product_name: product.product_name || `Product ${index + 1}`,
          categoryName: product.categoryName,
          unitPrice: product.unitPrice,
          length: product.length,
          width: product.width,
          quantity: product.quantity,
          unit: product.unit,
          totalPrice: product.totalPrice,
        })),
        subtotal: quotation.subtotal || 0,
        discount: quotation.discount || { type: 'percent', value: 0 },
        discountAmount: quotation.discountAmount || 0,
        totalAmount: quotation.totalAmount || 0,
        terms: quotation.terms || [],
        paymentTerms: quotation.paymentTerms || [],
        created_at: quotation.created_at,
      };

      const htmlContent = generateQuotationHTML(pdfData);
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });

      const today = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dateStr = `${today.getDate()}_${months[today.getMonth()]}_${today.getFullYear()}`;
      
      const formattedLeadName = lead.full_name
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const timestamp = Date.now();
      const customFileName = `${formattedLeadName}_${(user?.company_name || '').split(' ').join('_')}_Quote_${dateStr}_${timestamp}.pdf`;
      
      const tempFile = new File(uri);
      const newFile = new File(Paths.cache, customFileName);
      tempFile.copy(newFile);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Quotation PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully!');
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return { 
          color: '#64748B', 
          bg: '#F1F5F9', 
          icon: Clock,
          label: 'Draft' 
        };
      case 'sent':
        return { 
          color: '#3B82F6', 
          bg: '#DBEAFE', 
          icon: Send,
          label: 'Sent' 
        };
      case 'accepted':
        return { 
          color: '#10B981', 
          bg: '#D1FAE5', 
          icon: CheckCircle,
          label: 'Accepted' 
        };
      case 'rejected':
        return { 
          color: '#EF4444', 
          bg: '#FEE2E2', 
          icon: XCircle,
          label: 'Rejected' 
        };
      default:
        return { 
          color: '#64748B', 
          bg: '#F1F5F9', 
          icon: Clock,
          label: 'Unknown' 
        };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quotation Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </View>
    );
  }

  if (!quotation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quotation Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <FileText size={56} color="#CBD5E1" />
          <Text style={styles.errorTitle}>Quotation not found</Text>
          <Text style={styles.errorSubtitle}>Unable to load quotation details</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={loadQuotationDetails}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const lead = leads.find(l => l.id == quotation.leadId);
  const statusConfig = getStatusConfig(quotation.status);
  const StatusIcon = statusConfig.icon;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <TouchableOpacity 
          style={styles.previewButton} 
          onPress={handlePreview}
          activeOpacity={0.7}
        >
          <Text style={styles.previewButtonText}>Preview</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quotation Header Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.quotationBadge}>
              <FileText size={20} color="#3B82F6" />
              <Text style={styles.quotationNumber}>#{quotation.quotationNumber}</Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <StatusIcon size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <View style={styles.heroMeta}>
            <View style={styles.metaItem}>
              <Calendar size={16} color="#64748B" />
              <Text style={styles.metaLabel}>Created</Text>
            </View>
            <Text style={styles.metaValue}>{formatDate(quotation.created_at)}</Text>
          </View>

          {/* Total Amount Highlight */}
          <View style={styles.amountHighlight}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <View style={styles.amountRow}>
              <IndianRupee size={26} color="#10B981" />
              <Text style={styles.amountValue}>
                {quotation.totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Card */}
        {lead && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrapper}>
                <User size={20} color="#3B82F6" />
              </View>
              <Text style={styles.cardTitle}>Client Information</Text>
            </View>

            <View style={styles.clientDetails}>
              <View style={styles.clientRow}>
                <View style={styles.clientIcon}>
                  <User size={18} color="#3B82F6" />
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientLabel}>Name</Text>
                  <Text style={styles.clientValue}>{lead.full_name}</Text>
                </View>
              </View>

              <View style={styles.clientRow}>
                <View style={styles.clientIcon}>
                  <Briefcase size={18} color="#64748B" />
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientLabel}>Company</Text>
                  <Text style={styles.clientValue}>{lead.company_name}</Text>
                </View>
              </View>

              <View style={styles.clientRow}>
                <View style={styles.clientIcon}>
                  <Mail size={18} color="#64748B" />
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientLabel}>Email</Text>
                  <Text style={styles.clientValue}>{lead.email}</Text>
                </View>
              </View>

              <View style={styles.clientRow}>
                <View style={styles.clientIcon}>
                  <Phone size={18} color="#64748B" />
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientLabel}>Phone</Text>
                  <Text style={styles.clientValue}>{lead.phone}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Products Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrapper, { backgroundColor: '#FEF3C7' }]}>
              <Package size={20} color="#F59E0B" />
            </View>
            <Text style={styles.cardTitle}>Items ({quotation.products?.length || 0})</Text>
          </View>

          <View style={styles.productsContainer}>
            {quotation.products && quotation.products.map((product, index) => (
              <View 
                key={index} 
                style={[
                  styles.productItem,
                  index === quotation.products.length - 1 && styles.productItemLast
                ]}
              >
                <View style={styles.productHeader}>
                  <View style={styles.productIndexBadge}>
                    <Text style={styles.productIndexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.productName}>
                    {product.product_name || product.productId || `Item ${index + 1}`}
                  </Text>
                </View>

                <View style={styles.productMeta}>
                  <View style={styles.productBadge}>
                    <Tag size={12} color="#64748B" />
                    <Text style={styles.productBadgeText}>
                      {product.length} × {product.width} {product.unit}
                    </Text>
                  </View>
                  <View style={styles.productBadge}>
                    <Package size={12} color="#64748B" />
                    <Text style={styles.productBadgeText}>
                      Qty: {product.quantity}
                    </Text>
                  </View>
                  <View style={styles.productBadge}>
                    <IndianRupee size={12} color="#64748B" />
                    <Text style={styles.productBadgeText}>
                      ₹{product.unitPrice || product.unit_price}/unit
                    </Text>
                  </View>
                </View>

                <View style={styles.productFooter}>
                  <Text style={styles.productTotalLabel}>Item Total</Text>
                  <Text style={styles.productTotalValue}>
                    ₹{product.totalPrice?.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrapper, { backgroundColor: '#D1FAE5' }]}>
              <IndianRupee size={20} color="#10B981" />
            </View>
            <Text style={styles.cardTitle}>Pricing Summary</Text>
          </View>

          <View style={styles.pricingContainer}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Subtotal</Text>
              <Text style={styles.pricingValue}>
                ₹{quotation.subtotal?.toFixed(2) || '0.00'}
              </Text>
            </View>

            {quotation.discountAmount > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>
                  Discount 
                  {quotation.discount.type === 'percent' && 
                    ` (${quotation.discount.value}%)`}
                </Text>
                <Text style={[styles.pricingValue, styles.discountValue]}>
                  -₹{quotation.discountAmount?.toFixed(2) || '0.00'}
                </Text>
              </View>
            )}

            <View style={styles.pricingDivider} />

            <View style={styles.pricingRowTotal}>
              <Text style={styles.pricingLabelTotal}>Total Amount</Text>
              <Text style={styles.pricingValueTotal}>
                ₹{quotation.totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Terms */}
        {quotation.paymentTerms && quotation.paymentTerms.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrapper, { backgroundColor: '#D1FAE5' }]}>
                <CreditCard size={20} color="#10B981" />
              </View>
              <Text style={styles.cardTitle}>Payment Terms</Text>
            </View>

            <View style={styles.termsContainer}>
              {quotation.paymentTerms.map((term, index) => (
                <View key={index} style={styles.termItem}>
                  <View style={styles.termBullet} />
                  <View style={styles.termContent}>
                    <Text style={styles.termDescription}>{term.description}</Text>
                    {term.value && (
                      <Text style={styles.termValue}>{term.value}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Terms & Conditions */}
        {quotation.terms && quotation.terms.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrapper, { backgroundColor: '#FEE2E2' }]}>
                <FileCheck size={20} color="#EF4444" />
              </View>
              <Text style={styles.cardTitle}>Terms & Conditions</Text>
            </View>

            <View style={styles.termsContainer}>
              {quotation.terms.map((term, index) => (
                <View key={index} style={styles.termItem}>
                  <View style={styles.termBullet} />
                  <Text style={styles.termText}>{term}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {quotation.notes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrapper, { backgroundColor: '#E0E7FF' }]}>
                <FileText size={20} color="#6366F1" />
              </View>
              <Text style={styles.cardTitle}>Notes</Text>
            </View>

            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{quotation.notes}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.pdfButton]}
          onPress={handleCreatePDF}
          activeOpacity={0.8}
        >
          <Download size={20} color="#FFFFFF" />
          <Text style={styles.footerButtonText}>Download PDF</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.footerButton, styles.editButton]}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Edit size={20} color="#FFFFFF" />
          <Text style={styles.footerButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  editHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  placeholder: {
    width: 40,
  },
  
  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  
  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 24,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  quotationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quotationNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  amountHighlight: {
    backgroundColor: '#ECFDF5',
    borderRadius: 23,
    padding: 18,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.8,
  },
  
  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  
  // Client Details
  clientDetails: {
    gap: 16,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  clientIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
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
    marginBottom: 4,
  },
  clientValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  
  // Products
  productsContainer: {
    gap: 16,
  },
  productItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  productItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  productIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productIndexText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3B82F6',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  productMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  productBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  productBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  productTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  
  // Pricing
  pricingContainer: {
    gap: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  pricingValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  discountValue: {
    color: '#EF4444',
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  pricingRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  pricingLabelTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  pricingValueTotal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -0.5,
  },
  
  // Terms
  termsContainer: {
    gap: 10,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  termBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    marginTop: 7,
  },
  termContent: {
    flex: 1,
  },
  termDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  termValue: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  termText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
  
  // Notes
  notesContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    fontWeight: '500',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
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
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pdfButton: {
    backgroundColor: '#8B5CF6',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});