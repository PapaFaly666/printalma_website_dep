#13 sha256:6534f97e046748b5783b9a95c4790362bcfc88dd0dba782415c093e3eeca2c2f 84.93MB / 143.77MB 0.6s
#13 sha256:6534f97e046748b5783b9a95c4790362bcfc88dd0dba782415c093e3eeca2c2f 102.76MB / 143.77MB 0.8s
#13 sha256:6534f97e046748b5783b9a95c4790362bcfc88dd0dba782415c093e3eeca2c2f 123.73MB / 143.77MB 0.9s
#13 sha256:6534f97e046748b5783b9a95c4790362bcfc88dd0dba782415c093e3eeca2c2f 140.51MB / 143.77MB 1.1s
#13 sha256:6534f97e046748b5783b9a95c4790362bcfc88dd0dba782415c093e3eeca2c2f 143.77MB / 143.77MB 1.3s done
#13 extracting sha256:6534f97e046748b5783b9a95c4790362bcfc88dd0dba782415c093e3eeca2c2f
#13 extracting sha256:6534f97e046748b5783b9a95c4790362bcfc88dd0dba782415c093e3eeca2c2f 7.8s done
#13 CACHED
#14 [builder 5/6] COPY . .
#14 DONE 0.2s
#15 [builder 6/6] RUN npm run build
#15 0.208 
#15 0.208 > printalma_website@0.0.0 build
#15 0.208 > tsc -b && vite build
#15 0.208 
#15 23.29 src/components/vendor/InteractiveDesignPositioner.tsx(361,30): error TS2339: Property 'lastTransformUpdate' does not exist on type 'Window & typeof globalThis'.
#15 23.29 src/components/vendor/InteractiveDesignPositioner.tsx(363,14): error TS2339: Property 'lastTransformUpdate' does not exist on type 'Window & typeof globalThis'.
#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
------
 > [builder 6/6] RUN npm run build:
0.208 
0.208 > printalma_website@0.0.0 build
0.208 > tsc -b && vite build
0.208 
23.29 src/components/vendor/InteractiveDesignPositioner.tsx(361,30): error TS2339: Property 'lastTransformUpdate' does not exist on type 'Window & typeof globalThis'.
23.29 src/components/vendor/InteractiveDesignPositioner.tsx(363,14): error TS2339: Property 'lastTransformUpdate' does not exist on type 'Window & typeof globalThis'.
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