==> Cloning from https://github.com/PapaFaly666/printalma_website_dep
==> Checking out commit c26738721985a985490442ddd0abf06c148950a7 in branch main
#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 894B done
#1 DONE 0.0s
#2 [internal] load metadata for docker.io/library/node:20-alpine
#2 ...
#3 [auth] library/node:pull render-prod/docker-mirror-repository/library/node:pull token for us-west1-docker.pkg.dev
#3 DONE 0.0s
#4 [auth] library/nginx:pull render-prod/docker-mirror-repository/library/nginx:pull token for us-west1-docker.pkg.dev
#4 DONE 0.0s
#5 [internal] load metadata for docker.io/library/nginx:alpine
#5 DONE 0.7s
#2 [internal] load metadata for docker.io/library/node:20-alpine
#2 DONE 0.7s
#6 [internal] load .dockerignore
#6 transferring context: 2B done
#6 DONE 0.0s
#7 [builder 1/6] FROM docker.io/library/node:20-alpine@sha256:df02558528d3d3d0d621f112e232611aecfee7cbc654f6b375765f72bb262799
#7 resolve docker.io/library/node:20-alpine@sha256:df02558528d3d3d0d621f112e232611aecfee7cbc654f6b375765f72bb262799 0.0s done
#7 DONE 0.3s
#8 [internal] load build context
#8 transferring context: 17.37MB 0.5s done
#8 DONE 0.6s
#7 [builder 1/6] FROM docker.io/library/node:20-alpine@sha256:df02558528d3d3d0d621f112e232611aecfee7cbc654f6b375765f72bb262799
#7 sha256:a9e48ad1219d4d11c6456a8db0fd5c11af46242d52edf84e17ab84a7bfd93809 445B / 445B 0.2s done
#7 sha256:54225bd601967a0aa669ec9be621c24d8eeac874b698d55874018070898685c2 0B / 1.26MB 0.2s
#7 sha256:8c59d92d6fc9f01af4aaa86824be72b74bd4d940c4c46aa95d9710bfa46c975e 0B / 42.99MB 0.2s
#7 sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8 0B / 3.80MB 0.2s
#7 sha256:54225bd601967a0aa669ec9be621c24d8eeac874b698d55874018070898685c2 1.26MB / 1.26MB 0.3s done
#7 sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8 3.80MB / 3.80MB 0.3s done
#7 extracting sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8
#7 sha256:8c59d92d6fc9f01af4aaa86824be72b74bd4d940c4c46aa95d9710bfa46c975e 15.73MB / 42.99MB 0.5s
#7 extracting sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8 0.1s done
#7 sha256:8c59d92d6fc9f01af4aaa86824be72b74bd4d940c4c46aa95d9710bfa46c975e 42.03MB / 42.99MB 0.6s
#7 sha256:8c59d92d6fc9f01af4aaa86824be72b74bd4d940c4c46aa95d9710bfa46c975e 42.99MB / 42.99MB 0.7s done
#7 extracting sha256:8c59d92d6fc9f01af4aaa86824be72b74bd4d940c4c46aa95d9710bfa46c975e
#7 ...
#9 [stage-1 1/4] FROM docker.io/library/nginx:alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8
#9 resolve docker.io/library/nginx:alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8 0.0s done
#9 sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb 16.84MB / 16.84MB 0.4s done
#9 sha256:a992fbc61ecc9d8291c27f9add7b8a07d374c06a435d4734519b634762cf1c51 1.40kB / 1.40kB 0.2s done
#9 sha256:c9ebe2ff2d2cd981811cefb6df49a116da6074c770c07ee86a6ae2ebe7eee926 1.21kB / 1.21kB 0.2s done
#9 sha256:7a8a46741e18ed98437271669138116163f14596f411c1948fd7836e39f1afea 405B / 405B 0.1s done
#9 sha256:9adfbae99cb79774fdc14ca03a0a0154b8c199a69f69316bcfce64b07f80719f 955B / 955B 0.2s done
#9 sha256:403e3f251637881bbdc5fb06df8da55c149c00ccb0addbcb7839fa4ad60dfd04 628B / 628B 0.1s done
#9 sha256:6bc572a340ecbc60aca0c624f76b32de0b073d5efa4fa1e0b6d9da6405976946 1.81MB / 1.81MB 0.2s done
#9 extracting sha256:6bc572a340ecbc60aca0c624f76b32de0b073d5efa4fa1e0b6d9da6405976946 0.4s done
#9 DONE 1.7s
#9 [stage-1 1/4] FROM docker.io/library/nginx:alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8
#9 extracting sha256:403e3f251637881bbdc5fb06df8da55c149c00ccb0addbcb7839fa4ad60dfd04 0.0s done
#9 extracting sha256:9adfbae99cb79774fdc14ca03a0a0154b8c199a69f69316bcfce64b07f80719f 0.0s done
#9 extracting sha256:7a8a46741e18ed98437271669138116163f14596f411c1948fd7836e39f1afea 0.0s done
#9 DONE 1.8s
#7 [builder 1/6] FROM docker.io/library/node:20-alpine@sha256:df02558528d3d3d0d621f112e232611aecfee7cbc654f6b375765f72bb262799
#7 ...
#9 [stage-1 1/4] FROM docker.io/library/nginx:alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8
#9 extracting sha256:c9ebe2ff2d2cd981811cefb6df49a116da6074c770c07ee86a6ae2ebe7eee926 0.0s done
#9 extracting sha256:a992fbc61ecc9d8291c27f9add7b8a07d374c06a435d4734519b634762cf1c51 0.0s done
#9 extracting sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb 0.6s done
#9 DONE 2.4s
#7 [builder 1/6] FROM docker.io/library/node:20-alpine@sha256:df02558528d3d3d0d621f112e232611aecfee7cbc654f6b375765f72bb262799
#7 extracting sha256:8c59d92d6fc9f01af4aaa86824be72b74bd4d940c4c46aa95d9710bfa46c975e 1.6s done
#7 DONE 2.6s
#10 [stage-1 2/4] RUN apk add --no-cache gettext
#10 0.057 fetch https://dl-cdn.alpinelinux.org/alpine/v3.22/main/x86_64/APKINDEX.tar.gz
#10 0.186 fetch https://dl-cdn.alpinelinux.org/alpine/v3.22/community/x86_64/APKINDEX.tar.gz
#10 ...
#7 [builder 1/6] FROM docker.io/library/node:20-alpine@sha256:df02558528d3d3d0d621f112e232611aecfee7cbc654f6b375765f72bb262799
#7 extracting sha256:54225bd601967a0aa669ec9be621c24d8eeac874b698d55874018070898685c2 0.1s done
#7 extracting sha256:a9e48ad1219d4d11c6456a8db0fd5c11af46242d52edf84e17ab84a7bfd93809 0.0s done
#7 DONE 2.7s
#11 [builder 2/6] WORKDIR /app
#11 DONE 0.0s
#12 [builder 3/6] COPY package*.json ./
#12 DONE 0.0s
#13 [builder 4/6] RUN npm ci
#13 ...
#10 [stage-1 2/4] RUN apk add --no-cache gettext
#10 0.559 (1/3) Installing libgomp (14.2.0-r6)
#10 0.586 (2/3) Installing gettext-libs (0.24.1-r0)
#10 0.610 (3/3) Installing gettext (0.24.1-r0)
#10 0.650 Executing busybox-1.37.0-r18.trigger
#10 0.659 OK: 53 MiB in 73 packages
#10 DONE 0.8s
#13 [builder 4/6] RUN npm ci
#13 2.639 npm warn deprecated w3c-hr-time@1.0.2: Use your platform's native performance.now() and performance.timeOrigin.
#13 2.860 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
#13 3.193 npm warn deprecated npmlog@5.0.1: This package is no longer supported.
#13 3.481 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
#13 3.554 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
#13 3.802 npm warn deprecated gauge@3.0.2: This package is no longer supported.
#13 3.882 npm warn deprecated domexception@4.0.0: Use your platform's native DOMException instead
#13 3.911 npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
#13 4.112 npm warn deprecated are-we-there-yet@2.0.0: This package is no longer supported.
#13 4.113 npm warn deprecated abab@2.0.6: Use your platform's native atob() and btoa() methods instead
#13 8.002 
#13 8.002 added 513 packages, and audited 514 packages in 8s
#13 8.002 
#13 8.002 100 packages are looking for funding
#13 8.002   run `npm fund` for details
#13 8.003 
#13 8.003 found 0 vulnerabilities
#13 8.004 npm notice
#13 8.004 npm notice New major version of npm available! 10.8.2 -> 11.5.2
#13 8.004 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.5.2
#13 8.004 npm notice To update run: npm install -g npm@11.5.2
#13 8.004 npm notice
#13 DONE 11.5s
#14 [builder 5/6] COPY . .
#14 DONE 2.3s
#15 [builder 6/6] RUN npm run build
#15 0.243 
#15 0.243 > printalma_website@0.0.0 build
#15 0.243 > tsc -b && vite build
#15 0.243 
#15 25.63 vite v6.3.5 building for production...
#15 25.70 transforming...
#15 38.53 ✓ 3125 modules transformed.
#15 39.50 rendering chunks...
#15 40.58 [plugin vite:reporter] 
#15 40.58 (!) /app/src/services/productService.ts is dynamically imported by /app/src/services/api.ts but also statically imported by /app/src/components/ProductDiagnostic.tsx, /app/src/hooks/useProductForm.ts, /app/src/hooks/useProductSmart.ts, /app/src/hooks/useProducts.ts, dynamic import will not move module into another chunk.
#15 40.58 
#15 40.66 computing gzip size...
#15 40.75 dist/index.html                                       0.47 kB │ gzip:   0.31 kB
#15 40.75 dist/assets/index-CFOMkNgQ.css                      257.84 kB │ gzip:  35.71 kB
#15 40.75 dist/assets/vendorDesignProduct-2c7kznka.js           0.19 kB │ gzip:   0.15 kB
#15 40.75 dist/assets/buildProductStructure-BrLEEGla.js         0.65 kB │ gzip:   0.41 kB
#15 40.75 dist/assets/getOrCreateVendorProduct-DyrtiIB7.js      2.08 kB │ gzip:   1.02 kB
#15 40.75 dist/assets/vendorDesignProductAPI-LDG098Xu.js        3.64 kB │ gzip:   1.34 kB
#15 40.75 dist/assets/index-l3eCUntO.js                     3,137.27 kB │ gzip: 814.68 kB
#15 40.75 
#15 40.75 (!) Some chunks are larger than 500 kB after minification. Consider:
#15 40.75 - Using dynamic import() to code-split the application
#15 40.75 - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
#15 40.75 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
#15 40.75 ✓ built in 15.09s
#15 DONE 41.0s
#16 [stage-1 3/4] COPY --from=builder /app/dist /usr/share/nginx/html
#16 DONE 0.1s
#17 [stage-1 4/4] COPY nginx.conf /etc/nginx/conf.d/default.conf.template
#17 DONE 0.0s
#18 exporting to docker image format
#18 exporting layers
#18 exporting layers 0.4s done
#18 exporting manifest sha256:1a18d2aeeafe58e5901b4eadcaa19c6b96ac31f662e12f1b85d153d0351f2b94 0.0s done
#18 exporting config sha256:7000f4ae571410ebc550464cdd87b56027caac0dd4cf1e3b8db9adc040f5939a 0.0s done
#18 DONE 0.7s
#19 exporting cache to client directory
#19 preparing build cache for export
#19 writing cache manifest sha256:9399b4cfcdb31b3fa090476bcb724a2b96c1b31f733a951850c0ba673272e0fc done
#19 DONE 16.3s
Pushing image to registry...
Upload succeeded
==> Deploying...
2025/09/01 03:15:46 [emerg] 1#1: invalid port in "${PORT:-80}" of the "listen" directive in /etc/nginx/conf.d/default.conf:2
nginx: [emerg] invalid port in "${PORT:-80}" of the "listen" directive in /etc/nginx/conf.d/default.conf:2
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
2025/09/01 03:15:47 [emerg] 1#1: invalid port in "${PORT:-80}" of the "listen" directive in /etc/nginx/conf.d/default.conf:2
nginx: [emerg] invalid port in "${PORT:-80}" of the "listen" directive in /etc/nginx/conf.d/default.conf:2