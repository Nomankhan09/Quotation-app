// // components/QuotationFlowNavigator.tsx
// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { router, usePathname } from 'expo-router';
// import { RootState } from '@/store';

// // components/QuotationFlowNavigator.tsx
// export default function QuotationFlowNavigator() {
//   const dispatch = useDispatch();
//   const pathname = usePathname();
//   const { currentStep, isEditMode, editingQuotationId, prefillData } = useSelector(
//     (state: RootState) => state.quotationBuilder
//   );
//   const [hasHandledNavigation, setHasHandledNavigation] = useState(false);
//   const [isAppReady, setIsAppReady] = useState(false);

//   useEffect(() => {
//     // Mark app as ready after a short delay to ensure startup is complete
//     const timer = setTimeout(() => setIsAppReady(true), 100);
//     return () => clearTimeout(timer);
//   }, []);

//   useEffect(() => {
//     // Only handle navigation if:
//     // 1. App is ready
//     // 2. We're not already on a quotation create page
//     // 3. We have a current step to navigate to
//     // 4. We haven't already handled navigation
//     const isOnQuotationCreatePage = pathname?.includes('/quotation/create/');
    
//     if (isAppReady && !isOnQuotationCreatePage && currentStep && !hasHandledNavigation) {
//       const routeMap = {
//         'select-lead': '/quotation/create/select-lead',
//         'select-products': '/quotation/create/select-products',
//         'configure-products': '/quotation/create/configure-products',
//         'discount': '/quotation/create/discount',
//         'terms': '/quotation/create/terms',
//         'payment-terms': '/quotation/create/payment-terms',
//       } as const;

//       type RoutePath = typeof routeMap[keyof typeof routeMap];
//       const route = routeMap[currentStep as keyof typeof routeMap] as RoutePath | undefined;
      
//       if (route) {
//         setHasHandledNavigation(true);
        
//         // Use replace to avoid adding to navigation history
//         router.replace({
//           pathname: route,
//           params: {
//             editMode: isEditMode ? 'true' : 'false',
//             quotationId: editingQuotationId,
//             prefillData: prefillData ? JSON.stringify(prefillData) : undefined,
//           },
//         });
//       }
//     }
//   }, [currentStep, isEditMode, editingQuotationId, prefillData, pathname, hasHandledNavigation, isAppReady]);

//   return null;
// }