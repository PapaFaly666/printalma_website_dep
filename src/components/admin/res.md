#15 25.88 src/components/ProductDiagnostic.tsx(60,15): error TS2339: Property 'hasToken' does not exist on type 'Promise<{ isAuthenticated: boolean; user?: any; error?: string; }>'.
#15 25.88 src/components/ProductDiagnostic.tsx(62,22): error TS2339: Property 'isValid' does not exist on type 'Promise<{ isAuthenticated: boolean; user?: any; error?: string; }>'.
#15 25.88 src/components/ProductDiagnostic.tsx(91,41): error TS2339: Property 'hasToken' does not exist on type 'Promise<{ isAuthenticated: boolean; user?: any; error?: string; }>'.
#15 25.88 src/components/ProductDiagnostic.tsx(92,21): error TS2339: Property 'hasToken' does not exist on type 'Promise<{ isAuthenticated: boolean; user?: any; error?: string; }>'.
#15 25.88 src/components/ProductDiagnostic.tsx(94,44): error TS2339: Property 'isValid' does not exist on type 'Promise<{ isAuthenticated: boolean; user?: any; error?: string; }>'.
#15 25.88 src/components/ProductDiagnostic.tsx(95,25): error TS2339: Property 'tokenInfo' does not exist on type 'Promise<{ isAuthenticated: boolean; user?: any; error?: string; }>'.
#15 25.88 src/components/ProductDiagnostic.tsx(97,40): error TS2339: Property 'tokenInfo' does not exist on type 'Promise<{ isAuthenticated: boolean; user?: any; error?: string; }>'.
#15 25.88 src/components/ProductDiagnostic.tsx(98,42): error TS2339: Property 'tokenInfo' does not exist on type 'Promise<{ isAuthenticated: boolean; user?: any; error?: string; }>'.
#15 25.88 src/components/ProductDiagnostic.tsx(99,29): error TS2339: Property 'tokenInfo' does not exist on type 'Promise<{ isAuthenticated: boolean; user?: any; error?: string; }>'.
#15 25.88 src/components/admin/ClientDetailsSheet.tsx(388,68): error TS2345: Argument of type '{ firstName: string; lastName: string; email: string; vendeur_type: string; phone: string; country: string; address: string; shop_name: string; status: boolean; must_change_password: boolean; }' is not assignable to parameter of type 'AdminVendorUpdateData'.
#15 25.88   Types of property 'vendeur_type' are incompatible.
#15 25.88     Type 'string' is not assignable to type '"DESIGNER" | "INFLUENCEUR" | "ARTISTE"'.
#15 25.88 src/services/designService.ts(987,7): error TS2561: Object literal may only specify known properties, but 'categoryId' does not exist in type 'Design'. Did you mean to write 'category'?
#15 25.88 src/services/designService.ts(1080,7): error TS2561: Object literal may only specify known properties, but 'categoryId' does not exist in type 'Design'. Did you mean to write 'category'?
#15 25.88 src/services/vendorPublishService.ts(664,5): error TS2561: Object literal may only specify known properties, but 'category' does not exist in type '{ file: File; name: string; description?: string; price: number; categoryId: number; tags?: string; }'. Did you mean to write 'categoryId'?
#15 26.23 npm notice
#15 26.23 npm notice New major version of npm available! 10.8.2 -> 11.6.0
#15 26.23 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.0
#15 26.23 npm notice To update run: npm install -g npm@11.6.0
#15 26.23 npm notice
#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
------
 > [builder 6/6] RUN npm run build:
25.88   Types of property 'vendeur_type' are incompatible.
25.88     Type 'string' is not assignable to type '"DESIGNER" | "INFLUENCEUR" | "ARTISTE"'.
25.88 src/services/designService.ts(987,7): error TS2561: Object literal may only specify known properties, but 'categoryId' does not exist in type 'Design'. Did you mean to write 'category'?
25.88 src/services/designService.ts(1080,7): error TS2561: Object literal may only specify known properties, but 'categoryId' does not exist in type 'Design'. Did you mean to write 'category'?
25.88 src/services/vendorPublishService.ts(664,5): error TS2561: Object literal may only specify known properties, but 'category' does not exist in type '{ file: File; name: string; description?: string; price: number; categoryId: number; tags?: string; }'. Did you mean to write 'categoryId'?
26.23 npm notice
26.23 npm notice New major version of npm available! 10.8.2 -> 11.6.0
26.23 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.0
26.23 npm notice To update run: npm install -g npm@11.6.0
26.23 npm notice
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