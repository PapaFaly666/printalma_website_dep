#15 24.26 src/pages/AddProductPage.tsx(18,9): error TS2322: Type '{ editMode: boolean; initialProduct: any; editProductId: number; }' is not assignable to type 'IntrinsicAttributes & ProductFormMainProps'.
#15 24.26   Property 'editMode' does not exist on type 'IntrinsicAttributes & ProductFormMainProps'.
#15 24.26 src/pages/AppelDeFondsPage.tsx(44,5): error TS2322: Type 'Date' is not assignable to type 'string'.
#15 24.26 src/pages/AppelDeFondsPage.tsx(53,7): error TS2322: Type 'Date' is not assignable to type 'string'.
#15 24.27 src/pages/AppelDeFondsPage.tsx(54,7): error TS2322: Type 'Date' is not assignable to type 'string'.
#15 24.27 src/pages/AppelDeFondsPage.tsx(62,7): error TS2322: Type 'Date' is not assignable to type 'string'.
#15 24.27 src/pages/AppelDeFondsPage.tsx(70,7): error TS2322: Type 'Date' is not assignable to type 'string'.
#15 24.27 src/pages/AppelDeFondsPage.tsx(160,9): error TS2322: Type 'Date' is not assignable to type 'string'.
#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
------
 > [builder 6/6] RUN npm run build:
0.225 > tsc -b && vite build
0.225 
24.26 src/pages/AddProductPage.tsx(18,9): error TS2322: Type '{ editMode: boolean; initialProduct: any; editProductId: number; }' is not assignable to type 'IntrinsicAttributes & ProductFormMainProps'.
24.26   Property 'editMode' does not exist on type 'IntrinsicAttributes & ProductFormMainProps'.
24.26 src/pages/AppelDeFondsPage.tsx(44,5): error TS2322: Type 'Date' is not assignable to type 'string'.
24.26 src/pages/AppelDeFondsPage.tsx(53,7): error TS2322: Type 'Date' is not assignable to type 'string'.
24.27 src/pages/AppelDeFondsPage.tsx(54,7): error TS2322: Type 'Date' is not assignable to type 'string'.
24.27 src/pages/AppelDeFondsPage.tsx(62,7): error TS2322: Type 'Date' is not assignable to type 'string'.
24.27 src/pages/AppelDeFondsPage.tsx(70,7): error TS2322: Type 'Date' is not assignable to type 'string'.
24.27 src/pages/AppelDeFondsPage.tsx(160,9): error TS2322: Type 'Date' is not assignable to type 'string'.
------
Dockerfile:17
--------------------
  15 |     
  16 |     # Build the application
  17 | >>> RUN npm run build
  18 |     
  19 |     # Production stage
--------------------
error: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
error: exit status 1