import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { generateFileName } from '@/utils/quotation';
import { RootState } from '@/store';
import { useSelector } from 'react-redux';

export default function HtmlPreview() {
  const { html, leadName } = useLocalSearchParams<{ html: string, leadName: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!html) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No preview available</Text>
        </View>
      </View>
    );
  }

  // Enhanced HTML with responsive viewport and zoom controls
  // html-preview.tsx ke andar enhancedHtml ko aise update karein:

  const enhancedHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
      <style>
        * {
          box-sizing: border-box; /* Padding se width na badhe */
          -webkit-text-size-adjust: 100%;
        }
        body {
        zoom : 0.5;
          margin: 0;
          padding: 10px; /* Thoda padding side mein */
          font-family: -apple-system, sans-serif;
          background: #ffffff;
          width: 100vw; /* Viewport width fix */
          overflow-x: hidden; /* Horizontal scroll rokne ke liye */
        }
        /* Tables ko responsive banane ke liye */
        table {
          width: 100% !important;
          border-collapse: collapse;
          table-layout: auto; /* Fixed ki jagah auto use karein taaki content adjust ho sake */
        }
        img {
          max-width: 100% !important;
          height: auto !important;
        }
          @page {
            size: A4;
            margin: 10mm;
          }
        
          html, body {
            width: 100%;
            height: 100%;
          }
      </style>
    </head>
    <body
          style="
            width: 100%;
            height: 100%;
            padding: 20px;
            box-sizing: border-box;"
    >
      ${html}
    </body>
  </html>
`;
  // Two separate HTML generators

  const getPreviewHtml = () => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
      <style>
        * {
          box-sizing: border-box;
          -webkit-text-size-adjust: 100%;
        }
        body {
          zoom: 0.5;
          margin: 0;
          padding: 10px;
          font-family: -apple-system, sans-serif;
          background: #ffffff;
          width: 100vw;
          overflow-x: hidden;
        }
        table {
          width: 100% !important;
          border-collapse: collapse;
          table-layout: auto;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
        }
      </style>
    </head>
    <body style="width: 100%; padding: 20px; box-sizing: border-box;">
      ${html}
    </body>
  </html>
`;

  const getPdfHtml = () => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Helvetica, Arial, sans-serif;
          background: #ffffff;
          width: 100%;
        }
        table {
          width: 100% !important;
          border-collapse: collapse;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
        }
        @page {
          size: A4;
          margin: 10mm;
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
  </html>
`;

  const handleDownload = async () => {
    try {
      Alert.alert('Generating PDF', 'Please wait...');

      const { uri } = await Print.printToFileAsync({
        html: getPdfHtml(),
      });

      const fileName = generateFileName({
        format: user?.pdf_file_name_format || 'Quotation_{date}',
        companyName: user?.company_name || '',
        clientName: leadName || '',
        companyType: user?.company_type || ''
      });
      const newFile = new File(Paths.document, fileName);

      // copy content into new file
      const buffer = await fetch(uri).then(res => res.arrayBuffer());
      const data = new Uint8Array(buffer);
      await newFile.create({ overwrite: true });
      await newFile.write(data);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Quotation PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully!');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const handleShare = async () => {
    try {
      const { uri } = await Print.printToFileAsync({
        html: getPdfHtml(),
      });

      // File name change
      const fileName = generateFileName({
        format: user?.pdf_file_name_format || 'Quotation_{date}',
        companyName: user?.company_name || '',
        clientName: leadName || '',
        companyType: user?.company_type || ''
      });

      const newFile = new File(Paths.document, fileName);

      // copy content into new file
      const buffer = await fetch(uri).then(res => res.arrayBuffer());
      const data = new Uint8Array(buffer);
      await newFile.create({ overwrite: true });
      await newFile.write(data);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Quotation',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share quotation');
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Preview</Text>
          {/* <Text style={styles.headerSubtitle}>Zoom: {(zoomLevel * 100).toFixed(0)}%</Text> */}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Share2 size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading preview...</Text>
          </View>
        )}

        <WebView
          originWhitelist={['*']}
          source={{ html: getPreviewHtml() }}
          style={styles.webView}
          scalesPageToFit={true}
          scrollEnabled={true}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            Alert.alert('Error', 'Failed to load preview');
          }}
          // Enable pinch to zoom
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>

      {/* Zoom Controls */}
      {/* <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={handleZoomOut}
          activeOpacity={0.7}
          disabled={zoomLevel <= 0.5}
        >
          <ZoomOut size={20} color={zoomLevel <= 0.5 ? "#CBD5E1" : "#64748B"} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={handleResetZoom}
          activeOpacity={0.7}
        >
          <Maximize size={20} color="#64748B" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={handleZoomIn}
          activeOpacity={0.7}
          disabled={zoomLevel >= 3}
        >
          <ZoomIn size={20} color={zoomLevel >= 3 ? "#CBD5E1" : "#64748B"} />
        </TouchableOpacity>
      </View> */}

      {/* Fixed Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.downloadButton]}
          onPress={handleDownload}
          activeOpacity={0.8}
        >
          <Download size={20} color="#FFFFFF" />
          <Text style={styles.footerButtonText}>Download PDF</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // WebView
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },

  // Zoom Controls
  zoomControls: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    flexDirection: 'column',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Footer
  footer: {
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
  downloadButton: {
    backgroundColor: '#3B82F6',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});