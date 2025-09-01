auth.service.ts:30 
 
 POST http://localhost:3004/auth/login net::ERR_CONNECTION_REFUSED
AuthContext.tsx:184 🔍 Erreur de login détaillée: 
{error: TypeError: Failed to fetch
    at AuthService.request (http://localhost:5174/src/services/auth.serv…, message: 'Failed to fetch', statusCode: undefined, type: 'object'}
error
: 
TypeError: Failed to fetch at AuthService.request (http://localhost:5174/src/services/auth.service.ts:7:28) at AuthService.login (http://localhost:5174/src/services/auth.service.ts:47:17) at login (http://localhost:5174/src/contexts/AuthContext.tsx:96:42) at handleSubmit (http://localhost:5174/src/components/auth/LoginForm.tsx:71:28) at executeDispatch (http://localhost:5174/node_modules/.vite/deps/react-dom_client.js?v=a5c3fd5b:11736:11) at runWithFiberInDEV (http://localhost:5174/node_modules/.vite/deps/react-dom_client.js?v=a5c3fd5b:1485:72) at processDispatchQueue (http://localhost:5174/node_modules/.vite/deps/react-dom_client.js?v=a5c3fd5b:11772:37) at http://localhost:5174/node_modules/.vite/deps/react-dom_client.js?v=a5c3fd5b:12182:11 at batchedUpdates$1 (http://localhost:5174/node_modules/.vite/deps/react-dom_client.js?v=a5c3fd5b:2628:42) at dispatchEventForPluginEventSystem (http://localhost:5174/node_modules/.vite/deps/react-dom_client.js?v=a5c3fd5b:11877:9)
message
: 
"Failed to fetch"
statusCode
: 
undefined
type
: 
"object"
[[Prototype]]
: 
Object
﻿
