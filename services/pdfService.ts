import { IMAGE_URL } from "@/constants/constant";
import { getRoman } from "@/utils/roman_number";

// Enhanced HTML-based PDF generation for interior work quotations
interface Customer {
  full_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  location?: string;
}

interface Product {
  productId: number;
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
  specifications?: any[];
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

export const generateQuotationHTML = (quotationData: QuotationData, specifications: any): string => {
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
      <div style="background-color: rgb(245, 238, 230); border: 1px solid #dbccbb; padding: 5px; margin: 3px 0; padding-left: 50px; font-size: 18px; font-weight: bold;">
        ${category} : <span style="display: inline-block; margin-left: 10px;">₹${formatIndianNumber(categoryTotal)}</span>
      </div>
    `;

    // Add products for this category
    categoryProducts.forEach((product, productIndex) => {
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

      const isLastProduct = productIndex === categoryProducts.length - 1;
      const isLastCategory = Object.keys(groupedProducts).indexOf(category) === Object.keys(groupedProducts).length - 1;
      productsHTML += `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
          <tr style="font-size: 18px; ">
              <td style="width: 5%; text-align: left; padding: 4px 0; padding-left: 10px">${srNo++}</td>
              <td style="width: 15%; max-width: 150px; word-wrap: break-word; padding: 4px 0; padding-left: 10px">${product.product_name}</td>
              <td style="width: 5%; text-align: left; padding: 4px 0; padding-left: 10px">${product.quantity}</td>
              <td style="width: 10%; text-align: left; padding: 4px 0; padding-left: 10px">${dimensions}</td>
              <td style="width: 10%; text-align: left; padding: 4px 0; padding-left: 10px">₹${formatIndianNumber(product.unitPrice)}</td>
              <td style="width: 10%; text-align: left; padding: 4px 0; padding-left: 10px">₹${formatIndianNumber(product.totalPrice)}</td>
          </tr>
        </table>
        ${!isLastProduct ? `<div style="border-bottom: 1px solid #dbccbb; margin: 4px 0;"></div>` :
          isLastCategory ? `<div style="border-bottom: 1px solid #dbccbb"></div>` : ''}
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

    const percentage = Number(term.value);

    if (!isNaN(percentage)) {
      const calculatedAmount = (quotationData.totalAmount * percentage) / 100;
      amountHTML = `₹${formatIndianNumber(calculatedAmount)}`;
    }

    return `
    <div style="display: flex; justify-content: space-between; font-size: 16px; border-bottom: 1px solid #dbccbb;">
      <span style="width: 80%; padding: 6px 15px; border-right: 1px solid #dbccbb;">
        ${term.description} ${term.value}%
      </span>
      <span style="width: 20%; font-weight: 500; padding: 6px 15px; text-align: left;">
        ${amountHTML}
      </span>
    </div>
  `;
  }).join('');



  // Also add a total row for payment terms
  const paymentTermsTotalHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; background-color: rgb(245, 238, 230); border-top: 1px solid #dbccbb;">
       <span style="width: 80%; padding: 8px 15px; ">Total Amount to be paid</span>
       <span style="width: 20%; text-align: left; padding: 8px 15px; ">₹${formatIndianNumber(quotationData.totalAmount)}</span>
      </div>
  `;

  const termsHTML = quotationData.terms.map((term, index) => `
    <div style="font-size: 14px; margin-bottom: 8px; display: flex;">
      <div style="margin-right: 10px; min-width: 15px;">${index + 1}.</div>
      <div>${term}</div>
    </div>
  `).join('');

  // specifications
  const getAlphabet = (index: number) =>
    String.fromCharCode(65 + index);

  const specificationsHTML = quotationData?.specifications
    ?.map((spec, index) => {
      const specObj =
        typeof spec === "string" || typeof spec === "number"
          ? specifications.find((s) => s.id == spec)
          : spec;

      // ✅ IMPORTANT: guard here
      if (!specObj) return "";

      return `
      <div style="margin-bottom: 12px;">
        
        <div style="font-size: 15px; display: flex; font-weight: 600;">
          <div style="margin-right: 8px;">${getAlphabet(index)}.</div>
          <div>${specObj.item?.toUpperCase() || ""}</div>
        </div>

        <div style="margin-left: 20px; margin-top: 5px; font-size: 14px;">
          ${(specObj.description || [])
          .map(
            (d: any, i: number) => `
                <div style="display: flex; margin-bottom: 4px;">
                  <div style="margin-right: 8px; min-width: 18px;">
                    ${getRoman(i + 1)}.
                  </div>
                  <div>
                    ${d.description?.toUpperCase() || ""}
                  </div>
                </div>
              `
          )
          .join("")}
        </div>

      </div>
    `;
    })
    .join("");

  const logoUrl = IMAGE_URL + quotationData.user.company_logo || '';
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
  }

  @page {
    margin: 15mm 12mm; /* 👈 adds space on every page */
  }

  body {
    margin: 0;
  }

  .page-break {
    page-break-before: always;
  }

  .avoid-break {
    page-break-inside: avoid;
  }
</style>
</head>
<body style="margin: 0; padding: 0;  font-family: Helvetica, Arial, sans-serif;">
 <div style="
  width: 100%;
  margin: 0;
  padding: 10px 10px;
  box-sizing: border-box;
">
        <!-- Header Section -->
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 0px;">

  <!-- LOGO -->
  <div style="flex-shrink: 0;">
    <img 
      src="${logoUrl}" 
      style="width: 160px; height: auto; object-fit: contain;" 
      alt="Company Logo" 
    />
  </div>

  <!-- RIGHT CONTENT -->
  <div style="flex: 1;">
    <div style="color: #dfb163; font-size: 26px; font-weight: bold; margin-bottom: 3px;">
      Interior Work Quotation
    </div>

    <div style="border-top: 1px solid #dbccbb;">
      <div style="color: #826546; font-size: 16.5px; line-height: 1.6; border-bottom: 1px solid #dbccbb; padding: 2px 0;">
        Company Name | ${userCompanyName}, ${userCompanyAddress}-${userCompanyZip}
      </div>

      <div style="color: #826546; font-size: 16.5px; display: flex; justify-content: space-between; padding: 2px 0;">
        <span>Company Phone | ${userCompanyPhone}</span>
        <span>${userCompanyWebsite}</span>
      </div>
    </div>
  </div>
 

        </div>
        
        <div style="border-top: 1.5px solid #111; margin: 0px 0 14px;"></div>
        
        <!-- Customer Information -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div style="flex: 1;">
                <div style="font-size: 20px; font-weight: bold; margin-bottom: 6px;">To,</div>
                <div style="font-size: 19px; margin-bottom: 4px;">${quotationData.lead.full_name}</div>
                <div style="font-size: 19px; margin-bottom: 4px;">${quotationData.lead.location}</div>
                ${quotationData.lead.phone ? `
                <div style="margin-bottom: 3px; font-size: 19px;">
                    <span>${quotationData.lead.phone}</span>
                </div>
                ` : ''}
                ${quotationData.lead.email && quotationData.lead.email !== 'NA' ? `
                <div style="font-size: 19px;">
                    <span>${quotationData.lead.email}</span>
                </div>
                ` : ''}
            </div>
            <div style="text-align: right;">
                <div style="font-size: 17px; font-weight: bold; margin-bottom: 6px;">Quotation- <span style="font-weight:500;"> ${quotationData.quotationNumber} </span></div>
                <div style="font-size: 17px; font-weight: bold; margin-bottom: 6px;">Date: <span style="font-weight:500;">${formattedDate}</div>
                ${quotationData.validUntil ? `
                <div style="font-size: 17px; font-weight: bold; margin-bottom: 10px;">Valid Until: ${new Date(quotationData.validUntil).toLocaleDateString()}</span></div>
                ` : ''}
            </div>
        </div>
        
        <!-- Salutation and Message -->
        <div style="font-size: 20px; margin: 20px 0 15px 0;">Dear ${quotationData.lead.full_name?.split(' ')[0] || 'Sir/Madam'},</div>
        <div style="font-size: 20px; margin-left: 10px; margin-bottom: 5px;">Thank you for your valuable inquiry. We are pleased to quote as below:</div>
        
        <div style="border-top: 1px solid #f3e5d7; margin: 7px 0;"></div>
        
        <!-- Products Table Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
            <thead style="background-color: transparent;">
                <tr>
                    <th style="color: #7030a0; font-size: 20px; font-weight: bold; text-align: left; width: 5%;">Sr. No.</th>
                    <th style="color: #7030a0; font-size: 20px; font-weight: bold; text-align: left; width: 15%;">Description</th>
                    <th style="color: #7030a0; font-size: 20px; font-weight: bold; text-align: left; width: 5%;">QTY</th>
                    <th style="color: #7030a0; font-size: 20px; font-weight: bold; text-align: left; width: 10%;">Dimensions</th>
                    <th style="color: #7030a0; font-size: 20px; font-weight: bold; text-align: left; width: 10%;">Unit Price</th>
                    <th style="color: #7030a0; font-size: 20px; font-weight: bold; text-align: left; width: 10%;">Amount</th>
                </tr>
            </thead>
        </table>
        
        <!-- Products by Category -->
        ${productsHTML}
        
        <!-- Summary Section -->
        <div style="margin-left: auto; width: 230px;">
            <div style="display: flex; justify-content: space-between; background-color: rgb(245, 238, 230); border: 1px solid #dbccbb; padding: 5px 10px; margin-bottom: 2px; font-size: 19px;">
                <span>Total</span>
                <span>₹${formatIndianNumber(quotationData.totalAmount)}</span>
            </div>
        </div>
        
        <!-- Payment Terms - FIXED: Made full width -->
        ${quotationData.paymentTerms.length > 0 ? `
        <div style="width: 100%; margin: 24px 0; border: 1px solid #dbccbb; border-collapse: collapse;">
            <div style="background-color: rgb(245, 238, 230); padding: 8px 15px; font-weight: bold; font-size: 20px; border-bottom: 1px solid #dbccbb;">
                Payment Terms
            </div>
            <div>
                ${paymentTermsHTML}
                ${paymentTermsTotalHTML}
            </div>
        </div>
        ` : ''}
        
        <!-- Quotation Terms -->
        ${quotationData.terms.length > 0 ? `
        <div style="margin-bottom: 20px;">
            <div style="font-size: 19px; font-weight: bold; margin-bottom: 10px;">Quotation Terms:</div>
            <div style="padding: 5px 8px;">${termsHTML}</div>
        </div>
        ` : ''}

        <!-- Specifications -->
        ${quotationData?.specifications && quotationData?.specifications?.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <div style="font-size: 19px; font-weight: bold; margin-bottom: 10px;">
                Specifications:
              </div>
              <div style="padding: 5px 8px;">
                ${specificationsHTML}
              </div>
            </div>
        ` : ''}
        
        <!-- Notes -->
        ${quotationData.notes ? `
        <div style="margin-bottom: 20px;">
            <div style="font-size: 19px; font-weight: bold; margin-bottom: 10px;">Additional Notes:</div>
            <div style="font-size: 19px; margin-bottom: 8px; display: flex;">
                <div>${quotationData.notes}</div>
            </div>
        </div>
        ` : ''}
        
        <!-- Closing Message -->
        <div style="font-size: 21px; margin: 20px 0 40px 20px;">
            Thank you for considering our quotation. We look forward to the opportunity to serve you.
        </div>
        
        <!-- Signature Section -->
        <div style="text-align: right; margin-top: 50px;">
            <div style="font-size: 22px; font-weight: bold; margin-bottom: 40px;">${userCompanyName}</div>
            <div style="font-size: 19px;">AUTHORIZED SIGNATURE</div>
        </div>
    </div>
</body>
</html>
  `;
};