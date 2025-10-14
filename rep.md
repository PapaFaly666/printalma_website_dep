pfdev@pfdev-HP-ProBook-440-14-inch-G10-Notebook-PC:~/Bureau/PrintalmaProject/printalma_website_dep$ npm run build

> printalma_website@0.0.0 build
> tsc -b && vite build

src/pages/admin/AdminAccountPage.tsx:286:26 - error TS2551: Property 'createdAt' does not exist on type 'User'. Did you mean 'created_at'?

286                   {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                             ~~~~~~~~~

  src/types/auth.types.ts:20:3
    20   created_at?: string;
         ~~~~~~~~~~
    'created_at' is declared here.

src/pages/admin/AdminAccountPage.tsx:286:52 - error TS2551: Property 'createdAt' does not exist on type 'User'. Did you mean 'created_at'?

286                   {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                                                       ~~~~~~~~~

  src/types/auth.types.ts:20:3
    20   created_at?: string;
         ~~~~~~~~~~
    'created_at' is declared here.

src/pages/admin/AdminSettingsPage.tsx:133:77 - error TS2551: Property 'createdAt' does not exist on type 'User'. Did you mean 'created_at'?

133                 <p className="text-sm text-gray-900 dark:text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</p>
                                                                                ~~~~~~~~~

  src/types/auth.types.ts:20:3
    20   created_at?: string;
         ~~~~~~~~~~
    'created_at' is declared here.

src/pages/admin/AdminSettingsPage.tsx:133:103 - error TS2551: Property 'createdAt' does not exist on type 'User'. Did you mean 'created_at'?

133                 <p className="text-sm text-gray-900 dark:text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</p>
                                                                                                          ~~~~~~~~~

  src/types/auth.types.ts:20:3
    20   created_at?: string;
         ~~~~~~~~~~
    'created_at' is declared here.

src/pages/admin/EditReadyProductPage.tsx:595:17 - error TS2741: Property 'categories' is missing in type '{ designs: undefined[]; name: string; description: string; price: number; stock: number; status: "draft" | "published"; categoryId: number | null; subCategoryId: number | null; variationId: number | null; sizes: string[]; colorVariations: any[]; }' but required in type 'ProductFormData'.

595                 formData={{...formData, designs: []}}
                    ~~~~~~~~

  src/types/product.ts:10:3
    10   categories: string[];
         ~~~~~~~~~~
    'categories' is declared here.
  src/components/product-form/ProductFormFields.tsx:13:3
    13   formData: ProductFormData;
         ~~~~~~~~
    The expected type comes from property 'formData' which is declared here on type 'IntrinsicAttributes & ProductFormFieldsProps'

src/pages/admin/EditReadyProductPage.tsx:637:38 - error TS2551: Property 'categories' does not exist on type '{ name: string; description: string; price: number; stock: number; status: "published" | "draft"; categoryId: number; subCategoryId: number; variationId: number; sizes: string[]; colorVariations: any[]; }'. Did you mean 'categoryId'?

637                 categories={formData.categories}
                                         ~~~~~~~~~~

  src/pages/admin/EditReadyProductPage.tsx:127:5
    127     categoryId: null as number | null,
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    'categoryId' is declared here.

src/pages/vendor/VendorSales.tsx:450:38 - error TS2339: Property 'phoneNumber' does not exist on type 'Order'.

450                               {order.phoneNumber && (
                                         ~~~~~~~~~~~

src/pages/vendor/VendorSales.tsx:453:48 - error TS2339: Property 'phoneNumber' does not exist on type 'Order'.

453                                   <span>{order.phoneNumber}</span>
                                                   ~~~~~~~~~~~

src/pages/vendor/VendorSalesPage.tsx:24:24 - error TS2307: Cannot find module 'date-fns' or its corresponding type declarations.

24 import { format } from 'date-fns';
                          ~~~~~~~~~~

src/pages/vendor/VendorSalesPage.tsx:25:20 - error TS2307: Cannot find module 'date-fns/locale' or its corresponding type declarations.

25 import { fr } from 'date-fns/locale';
                      ~~~~~~~~~~~~~~~~~


Found 10 errors.

pfdev@pfdev-HP-ProBook-440-14-inch-G10-Notebook-PC:~/Bureau/PrintalmaProject/printalma_website_dep$