#15 25.83 src/pages/SellDesignPage.tsx(3958,13): error TS2353: Object literal may only specify known properties, and 'bypassValidation' does not exist in type '{ designUrl: string; designFile?: File; designId?: number; designName?: string; designPrice?: number; postValidationAction?: string; }'.
#15 26.14 npm notice
#15 26.14 npm notice New major version of npm available! 10.8.2 -> 11.6.0
#15 26.14 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.0
#15 26.14 npm notice To update run: npm install -g npm@11.6.0
#15 26.14 npm notice
#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
------
 > [builder 6/6] RUN npm run build:
0.458 
0.458 > printalma_website@0.0.0 build
0.458 > tsc -b && vite build
0.458 
25.83 src/pages/SellDesignPage.tsx(3958,13): error TS2353: Object literal may only specify known properties, and 'bypassValidation' does not exist in type '{ designUrl: string; designFile?: File; designId?: number; designName?: string; designPrice?: number; postValidationAction?: string; }'.
26.14 npm notice
26.14 npm notice New major version of npm available! 10.8.2 -> 11.6.0
26.14 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.0
26.14 npm notice To update run: npm install -g npm@11.6.0
26.14 npm notice
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