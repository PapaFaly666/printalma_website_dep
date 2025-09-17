POST http://localhost:3004/vendor/funds-requests 400 (Bad Request)
apiCall @ vendorFundsService.ts:114
createFundsRequest @ vendorFundsService.ts:211
handleSubmitRequest @ VendorFundsRequestPage.tsx:118
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
vendorFundsService.ts:133  Erreur API fonds vendeur /vendor/funds-requests: Error: description must be shorter than or equal to 1000 characters,description must be a string,description should not be empty
    at VendorFundsService.apiCall (vendorFundsService.ts:127:15)
    at async VendorFundsService.createFundsRequest (vendorFundsService.ts:211:24)
    at async handleSubmitRequest (VendorFundsRequestPage.tsx:118:30)