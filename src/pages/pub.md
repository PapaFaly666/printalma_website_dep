🔧 Mode développement: Simulation directe de création de demande
createFundsRequest @ vendorFundsService.ts:221
handleSubmitRequest @ VendorFundsRequestPage.tsx:138
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
VendorFundsRequestPage.tsx:140 ✅ Demande créée: {id: 1758122434423, vendorId: 2000, amount: 3000, requestedAmount: 3000, description: 'Demande de retrait 3 000 F', …}
VendorFundsRequestPage.tsx:98 🔄 Chargement des données d'appel de fonds...
vendorFundsService.ts:162  🔧 Mode développement: Utilisation directe des gains mock
getVendorEarnings @ vendorFundsService.ts:162
loadData @ VendorFundsRequestPage.tsx:102
handleSubmitRequest @ VendorFundsRequestPage.tsx:155
await in handleSubmitRequest
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
vendorFundsService.ts:181  🔧 Mode développement: Utilisation directe des demandes mock
getVendorFundsRequests @ vendorFundsService.ts:181
loadData @ VendorFundsRequestPage.tsx:103
handleSubmitRequest @ VendorFundsRequestPage.tsx:155
await in handleSubmitRequest
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
VendorFundsRequestPage.tsx:106 ✅ Données récupérées: {earningsData: {…}, requestsData: {…}}earningsData: {totalEarnings: 182500, pendingAmount: 23500, availableAmount: 159000, thisMonthEarnings: 182500, lastMonthEarnings: 156000, …}requestsData: {requests: Array(3), total: 3, page: 1, totalPages: 1, hasNext: false, …}[[Prototype]]: Object