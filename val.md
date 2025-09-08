#15 0.216 > tsc -b && vite build
#15 0.216 
#15 23.93 src/components/auth/CreateClientForm.tsx(225,9): error TS2353: Object literal may only specify known properties, and 'commissionRate' does not exist in type 'CreateClientRequest'.
#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
------
 > [builder 6/6] RUN npm run build:
0.216 
0.216 > printalma_website@0.0.0 build
0.216 > tsc -b && vite build
0.216 
23.93 src/components/auth/CreateClientForm.tsx(225,9): error TS2353: Object literal may only specify known properties, and 'commissionRate' does not exist in type 'CreateClientRequest'.
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