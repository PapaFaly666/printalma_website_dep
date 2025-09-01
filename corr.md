#15 26.68 src/components/admin/AutoValidationControls.tsx(25,50): error TS2339: Property 'autoValidateAll' does not exist on type 'AutoValidationService'.
#15 26.68 src/components/admin/AutoValidationStats.tsx(75,31): error TS2339: Property 'autoValidated' does not exist on type 'AutoValidationStats'.
#15 26.68 src/components/admin/AutoValidationStats.tsx(75,53): error TS2339: Property 'manualValidated' does not exist on type 'AutoValidationStats'.
#15 26.68 src/components/admin/AutoValidationStats.tsx(75,77): error TS2339: Property 'pending' does not exist on type 'AutoValidationStats'.
#15 26.68 src/components/admin/AutoValidationStats.tsx(77,15): error TS2339: Property 'autoValidated' does not exist on type 'AutoValidationStats'.
#15 26.68 src/components/admin/AutoValidationStats.tsx(111,69): error TS2339: Property 'autoValidated' does not exist on type 'AutoValidationStats'.
#15 26.68 src/components/admin/AutoValidationStats.tsx(123,68): error TS2339: Property 'manualValidated' does not exist on type 'AutoValidationStats'.
#15 26.68 src/components/admin/AutoValidationStats.tsx(135,70): error TS2339: Property 'pending' does not exist on type 'AutoValidationStats'.
#15 26.68 src/components/admin/AutoValidationStats.tsx(147,68): error TS2339: Property 'totalValidated' does not exist on type 'AutoValidationStats'.
#15 26.68 src/components/admin/AutoValidationStats.tsx(159,42): error TS2339: Property 'totalValidated' does not exist on type 'AutoValidationStats'.
#15 26.68 src/components/admin/AutoValidationStats.tsx(166,52): error TS2339: Property 'totalValidated' does not exist on type 'AutoValidationStats'.
#15 26.68 src/components/admin/AutoValidationStats.tsx(177,14): error TS2339: Property 'totalValidated' does not exist on type 'AutoValidationStats'.
#15 26.68 src/pages/admin/AutoValidationDashboard.tsx(14,16): error TS2339: Property 'updated' does not exist on type 'AutoValidationResult'.
#15 26.68 src/pages/admin/AutoValidationDashboard.tsx(15,31): error TS2339: Property 'updated' does not exist on type 'AutoValidationResult'.
#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
------
 > [builder 6/6] RUN npm run build:
26.68 src/components/admin/AutoValidationStats.tsx(77,15): error TS2339: Property 'autoValidated' does not exist on type 'AutoValidationStats'.
26.68 src/components/admin/AutoValidationStats.tsx(111,69): error TS2339: Property 'autoValidated' does not exist on type 'AutoValidationStats'.
26.68 src/components/admin/AutoValidationStats.tsx(123,68): error TS2339: Property 'manualValidated' does not exist on type 'AutoValidationStats'.
26.68 src/components/admin/AutoValidationStats.tsx(135,70): error TS2339: Property 'pending' does not exist on type 'AutoValidationStats'.
26.68 src/components/admin/AutoValidationStats.tsx(147,68): error TS2339: Property 'totalValidated' does not exist on type 'AutoValidationStats'.
26.68 src/components/admin/AutoValidationStats.tsx(159,42): error TS2339: Property 'totalValidated' does not exist on type 'AutoValidationStats'.
26.68 src/components/admin/AutoValidationStats.tsx(166,52): error TS2339: Property 'totalValidated' does not exist on type 'AutoValidationStats'.
26.68 src/components/admin/AutoValidationStats.tsx(177,14): error TS2339: Property 'totalValidated' does not exist on type 'AutoValidationStats'.
26.68 src/pages/admin/AutoValidationDashboard.tsx(14,16): error TS2339: Property 'updated' does not exist on type 'AutoValidationResult'.
26.68 src/pages/admin/AutoValidationDashboard.tsx(15,31): error TS2339: Property 'updated' does not exist on type 'AutoValidationResult'.
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