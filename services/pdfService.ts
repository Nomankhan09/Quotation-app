// Enhanced HTML-based PDF generation for interior work quotations
interface Customer {
  full_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
}

interface Product {
  productId: string;
  product_name: string;
  unitPrice: number;
  length: number;
  width: number;
  quantity: number;
  unit: 'feet' | 'inches';
  totalPrice: number;
  categoryName?: string;
}

interface QuotationData {
  user: any;
  quotationNumber: string;
  lead: Customer;
  products: Product[];
  subtotal: number;
  discount: {
    type: 'percent' | 'fixed';
    value: number;
  };
  discountAmount: number;
  totalAmount: number;
  terms: string[];
  paymentTerms: Array<{
    description: string;
    value: string;
  }>;
  created_at: string;
  validUntil?: string;
  notes?: string;
}

// Helper function to format Indian number format
const formatIndianNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to get current date components
const getCurrentDateComponents = () => {
  const now = new Date();
  const currentDay = now.getDate();
  const month = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();
  
  return { currentDay, month, currentYear };
};

// Group products by category
const groupProductsByCategory = (products: Product[]) => {
  const grouped: { [key: string]: Product[] } = {};
  
  products.forEach(product => {
    const category = product.categoryName || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(product);
  });
  
  return grouped;
};

// Calculate category totals
const calculateCategoryTotal = (products: Product[]) => {
  return products.reduce((total, product) => total + product.totalPrice, 0);
};

export const generateQuotationHTML = (quotationData: QuotationData): string => {
  const { currentDay, month, currentYear } = getCurrentDateComponents();
  const formattedDate = `${currentDay} ${month} ${currentYear}`;
  const groupedProducts = groupProductsByCategory(quotationData.products);
  
  let productsHTML = '';
  let srNo = 1;
  
  Object.keys(groupedProducts).forEach(category => {
    const categoryProducts = groupedProducts[category];
    const categoryTotal = calculateCategoryTotal(categoryProducts);
    
    // Add category header - FIXED: Use proper CSS background-color
    productsHTML += `
      <div style="background-color: rgb(223 213 202); border: 1px solid #dbccbb; padding: 5px; margin: 10px 0; padding-left: 50px; font-size: 11px; font-weight: bold;">
        ${category} : <span style="display: inline-block; margin-left: 10px;">₹${formatIndianNumber(categoryTotal)}</span>
      </div>
    `;
    
    // Add products for this category
    categoryProducts.forEach(product => {
      let dimensions = '0.00';
  
      if (product.length && product.width && product.unit) {
        let lengthInFeet = product.length;
        let widthInFeet = product.width;
        
        // Convert to feet if unit is inches
        if (product.unit.toLowerCase() === 'inches') {
          lengthInFeet = product.length / 12;
          widthInFeet = product.width / 12;
        }
        
        // Calculate area in square feet
        const area = lengthInFeet * widthInFeet;
        dimensions = `${area.toFixed(2)} sq ft`;
      }
      
      productsHTML += `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
          <tr style="font-size: 11px;">
            <td style="width: 8%; text-align: center;">${srNo++}</td>
            <td style="width: 35%; max-width: 150px; word-wrap: break-word;">${product.product_name}</td>
            <td style="width: 8%; text-align: center;">${product.quantity}</td>
            <td style="width: 15%; text-align: center;">${dimensions}</td>
            <td style="width: 15%;">₹${formatIndianNumber(product.unitPrice)}</td>
            <td style="width: 15%;">₹${formatIndianNumber(product.totalPrice)}</td>
          </tr>
        </table>
        <div style="border-bottom: 1px solid #dbccbb; margin: 10px 0;"></div>
      `;
    });
  });

  const extractPercentage = (description: string): number | null => {
  if (!description) return null;

  // Case 1: pure number => percentage
  if (/^\d+$/.test(description)) {
    return Number(description);
  }

  // Case 2: number with %
  const percentMatch = description.match(/(\d+)\s*%/);
  if (percentMatch) {
    return Number(percentMatch[1]);
  }

  return null;
};


  // Updated payment terms calculation and display - FIXED: Made full width
 const paymentTermsHTML = quotationData.paymentTerms.map((term, i) => {
  let amountHTML = '';

  const percentage = extractPercentage(term.description);

  if (percentage !== null) {
    const calculatedAmount =
      (quotationData.totalAmount * percentage) / 100;

    amountHTML = `₹${formatIndianNumber(calculatedAmount)}`;
  }

  return `
    <div style="display:flex; justify-content:space-between; padding:8px 15px; font-size:11px; border-bottom:1px solid #dbccbb;">
      <span>${term.description} ${term.value}</span>
      <span>${amountHTML}</span>
    </div>
  `;
}).join('');



  // Also add a total row for payment terms
  const paymentTermsTotalHTML = `
    <div style="display: flex; justify-content: space-between; padding: 8px 15px; font-size: 11px; border-bottom: none; font-weight: bold; color: #000; background-color: rgb(240, 240, 240);">
      <span>Total Amount to be paid</span>
      <span>₹${formatIndianNumber(quotationData.totalAmount)}</span>
    </div>
  `;

  const termsHTML = quotationData.terms.map((term, index) => `
    <div style="font-size: 11px; margin-bottom: 8px; display: flex;">
      <div style="margin-right: 10px; min-width: 15px;">${index + 1}.</div>
      <div>${term}</div>
    </div>
  `).join('');

  const logoUrl =  quotationData.user.company_logo_url || '';


  console.log('LOGO URL USED IN HTML:', logoUrl);
  console.log('USER OBJECT:', quotationData.user);


  const userCompanyName = quotationData.user.company_name || '';
  const userCompanyAddress = quotationData.user.company_address || '';
  const userCompanyZip = quotationData.user.zip_code || '';
  const userCompanyWebsite = quotationData.user.website || '';
  const userCompanyPhone = quotationData.user.company_phone || '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Work Quotation</title>
    <style>
      * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
      }
      .bg-beige {
          background-color: rgb(223 213 202) !important;
      }
  </style>
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: Helvetica, Arial, sans-serif;">
    <div style="width: 8.5in; min-height: 11in; background: white; margin: 0 auto; padding: 30px 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative;">
        <!-- Header Section -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div class="logo-section">
                <div style="width: 140px; height: 55px; display: flex; align-items: center; justify-content: center; color: #826546; font-size: 12px;">
                    <img src="${logoUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="Company Logo" />
                </div>
            </div>
            <div style="text-align: left; flex-grow: 1; margin-left: 30px;">
                <div style="border-top: 2px solid #dbccbb; border-bottom: 2px solid #dbccbb; padding: 5px 0; margin-bottom: 5px;">
                    <div style="color: #dfb163; font-size: 16px; font-weight: bold; margin-bottom: 5px;">Work Quotation</div>
                </div>
                <div style="color: #826546; font-size: 8px; line-height: 1.2;">
                    <div>Company Name | ${userCompanyName}, ${userCompanyAddress}-${userCompanyZip}</div>
                    <div>Company Phone | ${userCompanyPhone} &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ${userCompanyWebsite}</div>
                </div>
            </div>
        </div>
        
        <div style="border-top: 1px solid #000; margin: 10px 0;"></div>
        
        <!-- Customer Information -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div style="flex: 1;">
                <div style="font-size: 12px; font-weight: bold; margin-bottom: 10px;">To,</div>
                <div style="font-size: 11px; font-weight: bold; margin-bottom: 5px;">${quotationData.lead.full_name}</div>
                ${quotationData.lead.phone ? `
                <div style="display: flex; margin-bottom: 3px; font-size: 11px;">
                    <span>${quotationData.lead.phone}</span>
                </div>
                ` : ''}
                ${quotationData.lead.email ? `
                <div style="display: flex; margin-bottom: 3px; font-size: 11px;">
                    <span>${quotationData.lead.email}</span>
                </div>
                ` : ''}
            </div>
            <div style="text-align: right;">
                <div style="font-size: 12px; font-weight: bold; margin-bottom: 10px;">Quotation- ${quotationData.quotationNumber}</div>
                <div style="font-size: 12px; font-weight: bold; margin-bottom: 10px;">Date: ${formattedDate}</div>
                ${quotationData.validUntil ? `
                <div style="font-size: 12px; font-weight: bold; margin-bottom: 10px;">Valid Until: ${new Date(quotationData.validUntil).toLocaleDateString()}</div>
                ` : ''}
            </div>
        </div>
        
        <!-- Salutation and Message -->
        <div style="font-size: 11px; margin: 20px 0 10px 0;">Dear ${quotationData.lead.full_name?.split(' ')[0] || 'Sir/Madam'},</div>
        <div style="font-size: 11px; margin-left: 20px; margin-bottom: 15px;">Thank you for your valuable inquiry. We are pleased to quote as below:</div>
        
        <div style="border-top: 1px solid #dbccbb; margin: 10px 0;"></div>
        
        <!-- Products Table Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
            <thead style="background-color: transparent;">
                <tr>
                    <th style="color: #7030a0; font-size: 11px; font-weight: bold; padding: 5px 0; text-align: left; width: 8%;">Sr. No.</th>
                    <th style="color: #7030a0; font-size: 11px; font-weight: bold; padding: 5px 0; text-align: left; width: 35%;">Description</th>
                    <th style="color: #7030a0; font-size: 11px; font-weight: bold; padding: 5px 0; text-align: left; width: 8%;">QTY</th>
                    <th style="color: #7030a0; font-size: 11px; font-weight: bold; padding: 5px 0; text-align: left; width: 10%;">Dimensions</th>
                    <th style="color: #7030a0; font-size: 11px; font-weight: bold; padding: 5px 0; text-align: left; width: 15%;">Unit Price</th>
                    <th style="color: #7030a0; font-size: 11px; font-weight: bold; padding: 5px 0; text-align: left; width: 15%;">Amount</th>
                </tr>
            </thead>
            <tr>
                <td colspan="6" style="border-bottom: 1px solid #000;"></td>
            </tr>
        </table>
        
        <!-- Products by Category -->
        ${productsHTML}
        
        <!-- Summary Section -->
        <div style="margin-left: auto; width: 230px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; background-color: rgb(223 213 202); border: 1px solid #dbccbb; padding: 5px 10px; margin-bottom: 2px; font-size: 11px;">
                <span>Sub Total</span>
                <span>₹${formatIndianNumber(quotationData.subtotal)}</span>
            </div>
            ${quotationData.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; background-color: rgb(223 213 202); border: 1px solid #dbccbb; padding: 5px 10px; margin-bottom: 2px; font-size: 11px;">
                <span> Discount </span>
                <span>- ₹${formatIndianNumber(quotationData.discountAmount)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; background-color: rgb(223 213 202); border: 1px solid #dbccbb; padding: 5px 10px; margin-bottom: 2px; font-size: 11px;">
                <span>Total</span>
                <span>₹${formatIndianNumber(quotationData.totalAmount)}</span>
            </div>
        </div>
        
        <!-- Payment Terms - FIXED: Made full width -->
        ${quotationData.paymentTerms.length > 0 ? `
        <div style="width: 70%; margin: 20px 0; border: 1px solid #dbccbb;">
            <div style="background-color: rgb(223 213 202); padding: 10px; font-weight: bold; font-size: 12px; text-align: center;">Payment Terms</div>
            <div>
                ${paymentTermsHTML}
                ${paymentTermsTotalHTML}
            </div>
        </div>
        ` : ''}
        
        <!-- Quotation Terms -->
        ${quotationData.terms.length > 0 ? `
        <div style="margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 10px;">Quotation Terms:</div>
            ${termsHTML}
        </div>
        ` : ''}
        
        <!-- Notes -->
        ${quotationData.notes ? `
        <div style="margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 10px;">Additional Notes:</div>
            <div style="font-size: 11px; margin-bottom: 8px; display: flex;">
                <div>${quotationData.notes}</div>
            </div>
        </div>
        ` : ''}
        
        <!-- Closing Message -->
        <div style="font-size: 11px; margin: 20px 0 40px 20px;">
            Thank you for considering our quotation. We look forward to the opportunity to serve you.
        </div>
        
        <!-- Signature Section -->
        <div style="text-align: right; margin-top: 50px;">
            <div style="font-size: 13px; font-weight: bold; margin-bottom: 40px;">${userCompanyName}</div>
            <div style="font-size: 10px;">AUTHORIZED SIGNATURE</div>
        </div>
    </div>
</body>
</html>
  `;
};