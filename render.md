==> Cloning from https://github.com/PapaFaly666/printalma_website_dep
==> Checking out commit b8ff2711a30e784a15377edffbcc9f1a20d72abd in branch main
#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 653B done
#1 DONE 0.0s
#2 [internal] load metadata for docker.io/library/node:18-alpine
#2 ...
#3 [auth] library/node:pull render-prod/docker-mirror-repository/library/node:pull token for us-west1-docker.pkg.dev
#3 DONE 0.0s
#4 [auth] library/nginx:pull render-prod/docker-mirror-repository/library/nginx:pull token for us-west1-docker.pkg.dev
#4 DONE 0.0s
#5 [internal] load metadata for docker.io/library/nginx:alpine
#5 ...
#2 [internal] load metadata for docker.io/library/node:18-alpine
#2 DONE 0.6s
#5 [internal] load metadata for docker.io/library/nginx:alpine
#5 DONE 1.2s
#6 [internal] load .dockerignore
#6 transferring context: 2B done
#6 DONE 0.0s
#7 [stage-1 1/2] FROM docker.io/library/nginx:alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8
#7 resolve docker.io/library/nginx:alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8 0.0s done
#7 ...
#8 [internal] load build context
#8 transferring context: 17.36MB 0.5s done
#8 DONE 0.6s
#7 [stage-1 1/2] FROM docker.io/library/nginx:alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8
#7 sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb 0B / 16.84MB 0.2s
#7 sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb 1.05MB / 16.84MB 0.3s
#7 sha256:a992fbc61ecc9d8291c27f9add7b8a07d374c06a435d4734519b634762cf1c51 1.40kB / 1.40kB 0.2s done
#7 sha256:c9ebe2ff2d2cd981811cefb6df49a116da6074c770c07ee86a6ae2ebe7eee926 1.21kB / 1.21kB 0.2s done
#7 sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb 16.84MB / 16.84MB 0.4s done
#7 sha256:7a8a46741e18ed98437271669138116163f14596f411c1948fd7836e39f1afea 405B / 405B 0.1s done
#7 sha256:9adfbae99cb79774fdc14ca03a0a0154b8c199a69f69316bcfce64b07f80719f 955B / 955B 0.2s done
#7 sha256:403e3f251637881bbdc5fb06df8da55c149c00ccb0addbcb7839fa4ad60dfd04 628B / 628B 0.1s done
#7 sha256:6bc572a340ecbc60aca0c624f76b32de0b073d5efa4fa1e0b6d9da6405976946 0B / 1.81MB 0.2s
#7 sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8 0B / 3.80MB 0.2s
#7 sha256:6bc572a340ecbc60aca0c624f76b32de0b073d5efa4fa1e0b6d9da6405976946 1.81MB / 1.81MB 0.3s done
#7 sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8 3.80MB / 3.80MB 0.3s done
#7 extracting sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8
#7 extracting sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8 0.2s done
#7 DONE 1.5s
#9 [builder 1/6] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#9 resolve docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e 0.0s done
#9 sha256:dd71dde834b5c203d162902e6b8994cb2309ae049a0eabc4efea161b2b5a3d0e 40.01MB / 40.01MB 0.6s done
#9 sha256:25ff2da83641908f65c3a74d80409d6b1b62ccfaab220b9ea70b80df5a2e0549 446B / 446B 0.3s done
#9 sha256:1e5a4c89cee5c0826c540ab06d4b6b491c96eda01837f430bd47f0d26702d6e3 1.26MB / 1.26MB 0.4s done
#9 sha256:f18232174bc91741fdf3da96d85011092101a032a93a388b79e99e69c2d5c870 3.64MB / 3.64MB 0.4s done
#9 extracting sha256:f18232174bc91741fdf3da96d85011092101a032a93a388b79e99e69c2d5c870 0.1s done
#9 extracting sha256:dd71dde834b5c203d162902e6b8994cb2309ae049a0eabc4efea161b2b5a3d0e
#9 ...
#7 [stage-1 1/2] FROM docker.io/library/nginx:alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8
#7 extracting sha256:6bc572a340ecbc60aca0c624f76b32de0b073d5efa4fa1e0b6d9da6405976946 0.4s done
#7 DONE 1.9s
#7 [stage-1 1/2] FROM docker.io/library/nginx:alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8
#7 extracting sha256:403e3f251637881bbdc5fb06df8da55c149c00ccb0addbcb7839fa4ad60dfd04 0.0s done
#7 extracting sha256:9adfbae99cb79774fdc14ca03a0a0154b8c199a69f69316bcfce64b07f80719f 0.0s done
#7 extracting sha256:7a8a46741e18ed98437271669138116163f14596f411c1948fd7836e39f1afea 0.0s done
#7 extracting sha256:c9ebe2ff2d2cd981811cefb6df49a116da6074c770c07ee86a6ae2ebe7eee926 0.0s done
#7 extracting sha256:a992fbc61ecc9d8291c27f9add7b8a07d374c06a435d4734519b634762cf1c51 0.0s done
#7 extracting sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb
#7 extracting sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb 0.6s done
#7 DONE 2.5s
#9 [builder 1/6] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#9 extracting sha256:dd71dde834b5c203d162902e6b8994cb2309ae049a0eabc4efea161b2b5a3d0e 1.6s done
#9 extracting sha256:1e5a4c89cee5c0826c540ab06d4b6b491c96eda01837f430bd47f0d26702d6e3 0.1s done
#9 extracting sha256:25ff2da83641908f65c3a74d80409d6b1b62ccfaab220b9ea70b80df5a2e0549 0.0s done
#9 DONE 2.6s
#10 [builder 2/6] WORKDIR /app
#10 DONE 0.0s
#11 [builder 3/6] COPY package*.json ./
#11 DONE 0.0s
#12 [builder 4/6] RUN npm ci --only=production
#12 0.171 npm warn config only Use `--omit=dev` to omit dev dependencies from the install.
#12 0.852 npm warn EBADENGINE Unsupported engine {
#12 0.852 npm warn EBADENGINE   package: 'fabricjs-react@2.1.0',
#12 0.852 npm warn EBADENGINE   required: { node: '20' },
#12 0.852 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#12 0.852 npm warn EBADENGINE }
#12 0.854 npm warn EBADENGINE Unsupported engine {
#12 0.854 npm warn EBADENGINE   package: 'react-router@7.8.2',
#12 0.854 npm warn EBADENGINE   required: { node: '>=20.0.0' },
#12 0.854 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#12 0.854 npm warn EBADENGINE }
#12 0.854 npm warn EBADENGINE Unsupported engine {
#12 0.854 npm warn EBADENGINE   package: 'react-router-dom@7.8.2',
#12 0.854 npm warn EBADENGINE   required: { node: '>=20.0.0' },
#12 0.854 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#12 0.854 npm warn EBADENGINE }
#12 1.922 npm warn deprecated w3c-hr-time@1.0.2: Use your platform's native performance.now() and performance.timeOrigin.
#12 2.259 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
#12 2.438 npm warn deprecated npmlog@5.0.1: This package is no longer supported.
#12 2.627 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
#12 2.701 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
#12 2.887 npm warn deprecated gauge@3.0.2: This package is no longer supported.
#12 2.888 npm warn deprecated domexception@4.0.0: Use your platform's native DOMException instead
#12 3.073 npm warn deprecated are-we-there-yet@2.0.0: This package is no longer supported.
#12 3.074 npm warn deprecated abab@2.0.6: Use your platform's native atob() and btoa() methods instead
#12 6.348 
#12 6.348 added 315 packages, and audited 316 packages in 6s
#12 6.348 
#12 6.348 29 packages are looking for funding
#12 6.348   run `npm fund` for details
#12 6.349 
#12 6.349 found 0 vulnerabilities
#12 6.350 npm notice
#12 6.350 npm notice New major version of npm available! 10.8.2 -> 11.5.2
#12 6.350 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.5.2
#12 6.350 npm notice To update run: npm install -g npm@11.5.2
#12 6.350 npm notice
#12 DONE 8.3s
#13 [builder 5/6] COPY . .
#13 DONE 0.4s
#14 [builder 6/6] RUN npm run build
#14 0.211 
#14 0.211 > printalma_website@0.0.0 build
#14 0.211 > tsc -b && vite build
#14 0.211 
#14 0.215 sh: tsc: not found
#14 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 127
------
 > [builder 6/6] RUN npm run build:
0.211 
0.211 > printalma_website@0.0.0 build
0.211 > tsc -b && vite build
0.211 
0.215 sh: tsc: not found
------
Dockerfile:17
--------------------
  15 |     
  16 |     # Build the application
  17 | >>> RUN npm run build
  18 |     
  19 |     # Production stage
--------------------
error: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 127