PS C:\Users\HP\Desktop\printalma-perso\printalma_website_dep> npm run build

> printalma_website@0.0.0 build
> tsc -b && vite build

src/pages/admin/AdminPaymentRequestsPage.tsx:558:54 - error TS2551: Property 'requestedAt' does not exist on type 'FundsRequest'. Did you mean 'requestDate'?

558                             {formatDateShort(request.requestedAt || request.createdAt)}
                                                         ~~~~~~~~~~~

  src/services/vendorFundsService.ts:25:3
    25   requestDate: string;
         ~~~~~~~~~~~
    'requestDate' is declared here.

src/pages/admin/AdminPaymentRequestsPage.tsx:561:39 - error TS2551: Property 'requestedAt' does not exist on type 'FundsRequest'. Did you mean 'requestDate'?

561                             {(request.requestedAt || request.createdAt) ? new Date(request.requestedAt || request.createdAt).toLocaleTimeString('fr-FR', {
                                          ~~~~~~~~~~~

  src/services/vendorFundsService.ts:25:3
    25   requestDate: string;
         ~~~~~~~~~~~
    'requestDate' is declared here.

src/pages/admin/AdminPaymentRequestsPage.tsx:561:92 - error TS2551: Property 'requestedAt' does not exist on type 'FundsRequest'. Did you mean 'requestDate'?

561                             {(request.requestedAt || request.createdAt) ? new Date(request.requestedAt || request.createdAt).toLocaleTimeString('fr-FR', {
                                                                                               ~~~~~~~~~~~

  src/services/vendorFundsService.ts:25:3
    25   requestDate: string;
         ~~~~~~~~~~~
    'requestDate' is declared here.

src/pages/admin/AdminPaymentRequestsPage.tsx:592:35 - error TS2551: Property 'requestedAt' does not exist on type 'FundsRequest'. Did you mean 'requestDate'?

592                         {(request.requestedAt || request.createdAt) && request.validatedAt ? (
                                      ~~~~~~~~~~~

  src/services/vendorFundsService.ts:25:3
    25   requestDate: string;
         ~~~~~~~~~~~
    'requestDate' is declared here.

src/pages/admin/AdminPaymentRequestsPage.tsx:594:56 - error TS2551: Property 'requestedAt' does not exist on type 'FundsRequest'. Did you mean 'requestDate'?

594                             {calculateDuration(request.requestedAt || request.createdAt, request.validatedAt)}
                                                           ~~~~~~~~~~~

  src/services/vendorFundsService.ts:25:3
    25   requestDate: string;
         ~~~~~~~~~~~
    'requestDate' is declared here.

src/pages/vendor/VendorFundsRequestPage.tsx:503:37 - error TS2551: Property 'processedAt' does not exist on type 'FundsRequest'. Did you mean 'processedDate'?

503                         ) : request.processedAt && request.status === 'PAID' ? (
                                        ~~~~~~~~~~~

  src/services/vendorFundsService.ts:27:3
    27   processedDate?: string;
         ~~~~~~~~~~~~~
    'processedDate' is declared here.

src/pages/vendor/VendorFundsRequestPage.tsx:506:56 - error TS2551: Property 'processedAt' does not exist on type 'FundsRequest'. Did you mean 'processedDate'?

506                               {formatDateShort(request.processedAt)}
                                                           ~~~~~~~~~~~

  src/services/vendorFundsService.ts:27:3
    27   processedDate?: string;
         ~~~~~~~~~~~~~
    'processedDate' is declared here.

src/pages/vendor/VendorFundsRequestPage.tsx:512:49 - error TS2551: Property 'processedAt' does not exist on type 'FundsRequest'. Did you mean 'processedDate'?

512                               {new Date(request.processedAt).toLocaleTimeString('fr-FR', {
                                                    ~~~~~~~~~~~

  src/services/vendorFundsService.ts:27:3
    27   processedDate?: string;
         ~~~~~~~~~~~~~
    'processedDate' is declared here.

src/pages/vendor/VendorProductsPage.tsx:1088:13 - error TS2322: Type 'void' is not assignable to type 'ReactNode'.

1088             {/* 🔍 Debug temporaire */}
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~

src/pages/vendor/VendorProductsPage.tsx:1104:27 - error TS2719: Type 'VendorProductFromAPI' is not assignable to type 'VendorProductFromAPI'. Two different types with this name exist, but they are unrelated.
  The types of 'images.adminReferences' are incompatible between these types.
    Type '{ colorName: string; colorCode: string; adminImageUrl: string; imageType: string; }[]' is not assignable to type '{ colorName: string; colorCode: string; adminImageUrl: string; imageType: "admin_reference" | "base" | "detail"; }[]'.
      Type '{ colorName: string; colorCode: string; adminImageUrl: string; imageType: string; }' is not assignable to type '{ colorName: string; colorCode: string; adminImageUrl: string; imageType: "admin_reference" | "base" | "detail"; }'.
        Types of property 'imageType' are incompatible.
          Type 'string' is not assignable to type '"admin_reference" | "base" | "detail"'.

1104                           product={product}
                               ~~~~~~~

  src/components/vendor/SimpleProductPreview.tsx:99:3
    99   product: VendorProductFromAPI;
         ~~~~~~~
    The expected type comes from property 'product' which is declared here on type 'IntrinsicAttributes & SimpleProductPreviewProps'

src/pages/vendor/VendorProductsPage.tsx:1378:21 - error TS2719: Type 'VendorProductFromAPI' is not assignable to type 'VendorProductFromAPI'. Two different types with this name exist, but they are unrelated.
  The types of 'images.adminReferences' are incompatible between these types.
    Type '{ colorName: string; colorCode: string; adminImageUrl: string; imageType: string; }[]' is not assignable to type '{ colorName: string; colorCode: string; adminImageUrl: string; imageType: "admin_reference" | "base" | "detail"; }[]'.
      Type '{ colorName: string; colorCode: string; adminImageUrl: string; imageType: string; }' is not assignable to type '{ colorName: string; colorCode: string; adminImageUrl: string; imageType: "admin_reference" | "base" | "detail"; }'.
        Types of property 'imageType' are incompatible.
          Type 'string' is not assignable to type '"admin_reference" | "base" | "detail"'.

1378                     product={products.find(p => p.id === selectedProductId)!}
                         ~~~~~~~

  src/components/vendor/SimpleProductPreview.tsx:99:3
    99   product: VendorProductFromAPI;
         ~~~~~~~
    The expected type comes from property 'product' which is declared here on type 'IntrinsicAttributes & SimpleProductPreviewProps'


Found 11 errors.

PS C:\Users\HP\Desktop\printalma-perso\printalma_website_dep>