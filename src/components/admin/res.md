POST http://localhost:3004/vendor/designs 400 (Bad Request)
createDesignViaVendorDesigns @ designService.ts:1067
await in createDesignViaVendorDesigns
createDesign @ designService.ts:959
await in createDesign
handleConfirmDesignPrice @ SellDesignPage.tsx:3128
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
designService.ts:1076 📡 Réponse /vendor/designs: 400 Bad Request
designService.ts:1080  ❌ Erreur /vendor/designs: {message: 'Erreur création design: \n\x1B[31mInvalid \x1B[1m`this.pr… Available options are listed in \x1B[32mgreen\x1B[39m.', error: 'Bad Request', statusCode: 400}error: "Bad Request"message: "Erreur création design: \n\u001b[31mInvalid \u001b[1m`this.prisma.design.create()`\u001b[22m invocation in\u001b[39m\n\u001b[4m/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/vendor-product/vendor-publish.service.ts:1301:47\u001b[24m\n\n  \u001b[2m\u001b[90m1298\u001b[39m \u001b[36mthis\u001b[39m\u001b[34m.\u001b[39mlogger\u001b[34m.\u001b[39m\u001b[36mlog\u001b[39m\u001b[34m(\u001b[39m`✅ Design uploadé\u001b[34m:\u001b[39m $\u001b[34m{\u001b[39muploadResult\u001b[34m.\u001b[39msecure_url\u001b[34m}\u001b[39m`\u001b[34m)\u001b[39m\u001b[34m;\u001b[39m\u001b[22m\n  \u001b[2m\u001b[90m1299\u001b[39m \u001b[22m\n  \u001b[2m\u001b[90m1300\u001b[39m \u001b[90m// ✅ CRÉATION DU DESIGN EN BASE\u001b[39m\u001b[22m\n\u001b[1m\u001b[31m→\u001b[39m\u001b[22m \u001b[2m\u001b[90m1301\u001b[39m \u001b[36mconst\u001b[39m design = \u001b[36mawait\u001b[39m \u001b[36mthis\u001b[39m\u001b[34m.\u001b[39mprisma\u001b[34m.\u001b[39mdesign\u001b[34m.\u001b[39m\u001b[36mcreate\u001b[39m\u001b[34m(\u001b[39m\u001b[22m{\n         data: {\n           vendorId: 7,\n           name: \"test\",\n           description: \"ffffffffffff\",\n           price: 0,\n           \u001b[31mcategory\u001b[39m: \"Manga\",\n           \u001b[31m~~~~~~~~\u001b[39m\n           imageUrl: \"https://res.cloudinary.com/dsxab4qnu/image/upload/v1757692745/vendor-designs/vendor_7_design_1757692744243.jpg\",\n           thumbnailUrl: \"https://res.cloudinary.com/dsxab4qnu/image/upload/v1757692745/vendor-designs/vendor_7_design_1757692744243.jpg\",\n           cloudinaryPublicId: \"vendor-designs/vendor_7_design_1757692744243\",\n           fileSize: 38061,\n           originalFileName: \"design_1757692747554\",\n           dimensions: {\n             width: 1200,\n             height: 1200\n           },\n           format: \"jpg\",\n           tags: [],\n           isDraft: false,\n           isPublished: false,\n           isPending: true,\n           isValidated: false,\n       \u001b[32m?\u001b[39m   \u001b[32mid\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mInt\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mcategoryId\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mInt | Null\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mthumbnailPublicId\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mString | Null\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mcontentHash\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mString | Null\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32misDelete\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mBoolean\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mvalidatedAt\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mDateTime | Null\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mvalidatedBy\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mInt | Null\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mrejectionReason\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mString | Null\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32msubmittedForValidationAt\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mDateTime | Null\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mviews\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mInt\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mlikes\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mInt\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mearnings\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mFloat\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32musageCount\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mInt\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mcreatedAt\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mDateTime\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mupdatedAt\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mDateTime\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mpublishedAt\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mDateTime | Null\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mvendorProducts\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mVendorProductUncheckedCreateNestedManyWithoutDesignInput\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mdesignProductLinks\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mDesignProductLinkUncheckedCreateNestedManyWithoutDesignInput\u001b[39m,\n       \u001b[32m?\u001b[39m   \u001b[32mproductPositions\u001b[39m\u001b[32m?\u001b[39m\u001b[32m: \u001b[39m\u001b[32mProductDesignPositionUncheckedCreateNestedManyWithoutDesignInput\u001b[39m\n         }\n       }\u001b[2m)\u001b[22m\n\nUnknown argument `\u001b[31mcategory\u001b[39m`. Did you mean `\u001b[32mcategoryId\u001b[39m`? Available options are listed in \u001b[32mgreen\u001b[39m."statusCode: 400[[Prototype]]: Object
createDesignViaVendorDesigns @ designService.ts:1080
await in createDesignViaVendorDesigns
createDesign @ designService.ts:959
await in createDesign
handleConfirmDesignPrice @ SellDesignPage.tsx:3128
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
designService.ts:962  ❌ Erreur création design (toutes méthodes échouées): Error: Erreur création design: 
[31mInvalid [1m`this.prisma.design.create()`[22m invocation in[39m
[4m/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/vendor-product/vendor-publish.service.ts:1301:47[24m

  [2m[90m1298[39m [36mthis[39m[34m.[39mlogger[34m.[39m[36mlog[39m[34m([39m`✅ Design uploadé[34m:[39m $[34m{[39muploadResult[34m.[39msecure_url[34m}[39m`[34m)[39m[34m;[39m[22m
  [2m[90m1299[39m [22m
  [2m[90m1300[39m [90m// ✅ CRÉATION DU DESIGN EN BASE[39m[22m
[1m[31m→[39m[22m [2m[90m1301[39m [36mconst[39m design = [36mawait[39m [36mthis[39m[34m.[39mprisma[34m.[39mdesign[34m.[39m[36mcreate[39m[34m([39m[22m{
         data: {
           vendorId: 7,
           name: "test",
           description: "ffffffffffff",
           price: 0,
           [31mcategory[39m: "Manga",
           [31m~~~~~~~~[39m
           imageUrl: "https://res.cloudinary.com/dsxab4qnu/image/upload/v1757692745/vendor-designs/vendor_7_design_1757692744243.jpg",
           thumbnailUrl: "https://res.cloudinary.com/dsxab4qnu/image/upload/v1757692745/vendor-designs/vendor_7_design_1757692744243.jpg",
           cloudinaryPublicId: "vendor-designs/vendor_7_design_1757692744243",
           fileSize: 38061,
           originalFileName: "design_1757692747554",
           dimensions: {
             width: 1200,
             height: 1200
           },
           format: "jpg",
           tags: [],
           isDraft: false,
           isPublished: false,
           isPending: true,
           isValidated: false,
       [32m?[39m   [32mid[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mcategoryId[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mthumbnailPublicId[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mcontentHash[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32misDelete[39m[32m?[39m[32m: [39m[32mBoolean[39m,
       [32m?[39m   [32mvalidatedAt[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32mvalidatedBy[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mrejectionReason[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32msubmittedForValidationAt[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32mviews[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mlikes[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mearnings[39m[32m?[39m[32m: [39m[32mFloat[39m,
       [32m?[39m   [32musageCount[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mcreatedAt[39m[32m?[39m[32m: [39m[32mDateTime[39m,
       [32m?[39m   [32mupdatedAt[39m[32m?[39m[32m: [39m[32mDateTime[39m,
       [32m?[39m   [32mpublishedAt[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32mvendorProducts[39m[32m?[39m[32m: [39m[32mVendorProductUncheckedCreateNestedManyWithoutDesignInput[39m,
       [32m?[39m   [32mdesignProductLinks[39m[32m?[39m[32m: [39m[32mDesignProductLinkUncheckedCreateNestedManyWithoutDesignInput[39m,
       [32m?[39m   [32mproductPositions[39m[32m?[39m[32m: [39m[32mProductDesignPositionUncheckedCreateNestedManyWithoutDesignInput[39m
         }
       }[2m)[22m

Unknown argument `[31mcategory[39m`. Did you mean `[32mcategoryId[39m`? Available options are listed in [32mgreen[39m.
    at DesignService.createDesignViaVendorDesigns (designService.ts:1081:13)
    at async DesignService.createDesign (designService.ts:959:14)
    at async handleConfirmDesignPrice (SellDesignPage.tsx:3128:31)
createDesign @ designService.ts:962
await in createDesign
handleConfirmDesignPrice @ SellDesignPage.tsx:3128
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
SellDesignPage.tsx:3172  ❌ Erreur création design: Error: Erreur création design: 
[31mInvalid [1m`this.prisma.design.create()`[22m invocation in[39m
[4m/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/vendor-product/vendor-publish.service.ts:1301:47[24m

  [2m[90m1298[39m [36mthis[39m[34m.[39mlogger[34m.[39m[36mlog[39m[34m([39m`✅ Design uploadé[34m:[39m $[34m{[39muploadResult[34m.[39msecure_url[34m}[39m`[34m)[39m[34m;[39m[22m
  [2m[90m1299[39m [22m
  [2m[90m1300[39m [90m// ✅ CRÉATION DU DESIGN EN BASE[39m[22m
[1m[31m→[39m[22m [2m[90m1301[39m [36mconst[39m design = [36mawait[39m [36mthis[39m[34m.[39mprisma[34m.[39mdesign[34m.[39m[36mcreate[39m[34m([39m[22m{
         data: {
           vendorId: 7,
           name: "test",
           description: "ffffffffffff",
           price: 0,
           [31mcategory[39m: "Manga",
           [31m~~~~~~~~[39m
           imageUrl: "https://res.cloudinary.com/dsxab4qnu/image/upload/v1757692745/vendor-designs/vendor_7_design_1757692744243.jpg",
           thumbnailUrl: "https://res.cloudinary.com/dsxab4qnu/image/upload/v1757692745/vendor-designs/vendor_7_design_1757692744243.jpg",
           cloudinaryPublicId: "vendor-designs/vendor_7_design_1757692744243",
           fileSize: 38061,
           originalFileName: "design_1757692747554",
           dimensions: {
             width: 1200,
             height: 1200
           },
           format: "jpg",
           tags: [],
           isDraft: false,
           isPublished: false,
           isPending: true,
           isValidated: false,
       [32m?[39m   [32mid[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mcategoryId[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mthumbnailPublicId[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mcontentHash[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32misDelete[39m[32m?[39m[32m: [39m[32mBoolean[39m,
       [32m?[39m   [32mvalidatedAt[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32mvalidatedBy[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mrejectionReason[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32msubmittedForValidationAt[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32mviews[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mlikes[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mearnings[39m[32m?[39m[32m: [39m[32mFloat[39m,
       [32m?[39m   [32musageCount[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mcreatedAt[39m[32m?[39m[32m: [39m[32mDateTime[39m,
       [32m?[39m   [32mupdatedAt[39m[32m?[39m[32m: [39m[32mDateTime[39m,
       [32m?[39m   [32mpublishedAt[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32mvendorProducts[39m[32m?[39m[32m: [39m[32mVendorProductUncheckedCreateNestedManyWithoutDesignInput[39m,
       [32m?[39m   [32mdesignProductLinks[39m[32m?[39m[32m: [39m[32mDesignProductLinkUncheckedCreateNestedManyWithoutDesignInput[39m,
       [32m?[39m   [32mproductPositions[39m[32m?[39m[32m: [39m[32mProductDesignPositionUncheckedCreateNestedManyWithoutDesignInput[39m
         }
       }[2m)[22m

Unknown argument `[31mcategory[39m`. Did you mean `[32mcategoryId[39m`? Available options are listed in [32mgreen[39m.
    at DesignService.createDesignViaVendorDesigns (designService.ts:1081:13)
    at async DesignService.createDesign (designService.ts:959:14)
    at async handleConfirmDesignPrice (SellDesignPage.tsx:3128:31)