dep\node_modules\@babel\parser\lib\index.js:11331:23)
PS C:\Users\HP\Desktop\printalma-perso\printalma_website_dep> npm run dev

> printalma_website@0.0.0 dev
> vite


  VITE v6.3.5  ready in 970 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
23:49:49 [vite] (client) Pre-transform error: C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\src\pages\admin\AdminProductValidation.tsx: Unexpected token, expected "," (339:17)

  337 |                     </>
  338 |                   );
> 339 |                 }})()}
      |                  ^
  340 |               </div>
  341 |             )}
  342 |             <DialogFooter>
  Plugin: vite:react-babel
  File: C:/Users/HP/Desktop/printalma-perso/printalma_website_dep/src/pages/admin/AdminProductValidation.tsx:339:17
  343|                <Button variant="outline" onClick={()=>setSelectedProduct(null)}>Annuler</Button>
  344|                {validation.approved===null ? null : (
  345|                  <Button onClick={handleValidate} disabled={processing || (validation.approved===false && !validation.reason.trim())} className={validation.approved?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'}>
     |                                                                                              
                            ^
  346|                    {processing? 'Traitement...' : validation.approved ? 'Approuver' : 'Rejeter'}
  347|                  </Button>
23:49:57 [vite] Internal server error: C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\src\pages\admin\AdminProductValidation.tsx: Unexpected token, expected "," (339:17)

  337 |                     </>
  338 |                   );
> 339 |                 }})()}
      |                  ^
  340 |               </div>
  341 |             )}
  342 |             <DialogFooter>
  Plugin: vite:react-babel
  File: C:/Users/HP/Desktop/printalma-perso/printalma_website_dep/src/pages/admin/AdminProductValidation.tsx:339:17
  343|                <Button variant="outline" onClick={()=>setSelectedProduct(null)}>Annuler</Button>
  344|                {validation.approved===null ? null : (
  345|                  <Button onClick={handleValidate} disabled={processing || (validation.approved===false && !validation.reason.trim())} className={validation.approved?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'}>
     |                                                                                                                          ^
  346|                    {processing? 'Traitement...' : validation.approved ? 'Approuver' : 'Rejeter'}
  347|                  </Button>
      at constructor (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:367:19)
      at TypeScriptParserMixin.raise (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:6630:19)
      at TypeScriptParserMixin.unexpected (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:6650:16)
      at TypeScriptParserMixin.expect (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:6930:12)
      at TypeScriptParserMixin.parseParenAndDistinguishExpression (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11665:14)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11331:23)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4797:20)
      at TypeScriptParserMixin.parseExprSubscripts (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11081:23)
      at TypeScriptParserMixin.parseUpdate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11066:21)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11046:23)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9857:18)
      at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10899:61)
      at TypeScriptParserMixin.parseExprOps (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10904:23)
      at TypeScriptParserMixin.parseMaybeConditional (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10881:23)
      at TypeScriptParserMixin.parseMaybeAssign (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10831:21)
      at TypeScriptParserMixin.parseMaybeAssign (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9806:20)
      at TypeScriptParserMixin.parseExpressionBase (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10784:23)
      at C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10780:39
      at TypeScriptParserMixin.allowInAnd (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12432:12)
      at TypeScriptParserMixin.parseExpression (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10780:17)
      at TypeScriptParserMixin.jsxParseExpressionContainer (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4665:31)
      at TypeScriptParserMixin.jsxParseElementAt (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4744:36)
      at TypeScriptParserMixin.jsxParseElement (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4782:17)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4792:19)
      at TypeScriptParserMixin.parseExprSubscripts (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11081:23)
      at TypeScriptParserMixin.parseUpdate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11066:21)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11046:23)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9857:18)
      at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10899:61)
      at TypeScriptParserMixin.parseExprOps (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10904:23)
      at TypeScriptParserMixin.parseMaybeConditional (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10881:23)
      at TypeScriptParserMixin.parseMaybeAssign (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10831:21)
      at C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9795:39
      at TypeScriptParserMixin.tryParse (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:6938:20)
      at TypeScriptParserMixin.parseMaybeAssign (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9795:18)
      at C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10800:39
      at TypeScriptParserMixin.allowInAnd (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12432:12)
      at TypeScriptParserMixin.parseMaybeAssignAllowIn (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10800:17)
      at TypeScriptParserMixin.parseMaybeAssignAllowInOrVoidPattern (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12499:17)
      at TypeScriptParserMixin.parseParenAndDistinguishExpression (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11679:28)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11331:23)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4797:20)
      at TypeScriptParserMixin.parseExprSubscripts (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11081:23)
      at TypeScriptParserMixin.parseUpdate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11066:21)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11046:23)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9857:18)
      at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10899:61)
      at TypeScriptParserMixin.parseExprOpBaseRightExpr (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10986:34)
      at TypeScriptParserMixin.parseExprOpRightExpr (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10981:21)
      at TypeScriptParserMixin.parseExprOp (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10947:27)
23:50:19 [vite] (client) page reload src/pages/pub.md
23:50:20 [vite] (client) Pre-transform error: C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\src\pages\admin\AdminProductValidation.tsx: Unexpected token, expected "," (339:17)

  337 |                     </>
  338 |                   );
> 339 |                 }})()}
      |                  ^
  340 |               </div>
  341 |             )}
  342 |             <DialogFooter>
  Plugin: vite:react-babel
  File: C:/Users/HP/Desktop/printalma-perso/printalma_website_dep/src/pages/admin/AdminProductValidation.tsx:339:17
  343|                <Button variant="outline" onClick={()=>setSelectedProduct(null)}>Annuler</Button>
  344|                {validation.approved===null ? null : (
  345|                  <Button onClick={handleValidate} disabled={processing || (validation.approved===false && !validation.reason.trim())} className={validation.approved?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'}>
     |                                                                                              
                            ^
  346|                    {processing? 'Traitement...' : validation.approved ? 'Approuver' : 'Rejeter'}
  347|                  </Button>
23:50:21 [vite] Internal server error: C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\src\pages\admin\AdminProductValidation.tsx: Unexpected token, expected "," (339:17)

  337 |                     </>
  338 |                   );
> 339 |                 }})()}
      |                  ^
  340 |               </div>
  341 |             )}
  342 |             <DialogFooter>
  Plugin: vite:react-babel
  File: C:/Users/HP/Desktop/printalma-perso/printalma_website_dep/src/pages/admin/AdminProductValidation.tsx:339:17
  343|                <Button variant="outline" onClick={()=>setSelectedProduct(null)}>Annuler</Button>
  344|                {validation.approved===null ? null : (
  345|                  <Button onClick={handleValidate} disabled={processing || (validation.approved===false && !validation.reason.trim())} className={validation.approved?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'}>
     |                                                                                                                          ^
  346|                    {processing? 'Traitement...' : validation.approved ? 'Approuver' : 'Rejeter'}
  347|                  </Button>
      at constructor (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:367:19)
      at TypeScriptParserMixin.raise (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:6630:19)
      at TypeScriptParserMixin.unexpected (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:6650:16)
      at TypeScriptParserMixin.expect (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:6930:12)
      at TypeScriptParserMixin.parseParenAndDistinguishExpression (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11665:14)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11331:23)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4797:20)
      at TypeScriptParserMixin.parseExprSubscripts (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11081:23)
      at TypeScriptParserMixin.parseUpdate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11066:21)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11046:23)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9857:18)
      at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10899:61)
      at TypeScriptParserMixin.parseExprOps (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10904:23)
      at TypeScriptParserMixin.parseMaybeConditional (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10881:23)
      at TypeScriptParserMixin.parseMaybeAssign (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10831:21)
      at TypeScriptParserMixin.parseMaybeAssign (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9806:20)
      at TypeScriptParserMixin.parseExpressionBase (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10784:23)
      at C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10780:39
      at TypeScriptParserMixin.allowInAnd (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12432:12)
      at TypeScriptParserMixin.parseExpression (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10780:17)
      at TypeScriptParserMixin.jsxParseExpressionContainer (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4665:31)
      at TypeScriptParserMixin.jsxParseElementAt (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4744:36)
      at TypeScriptParserMixin.jsxParseElement (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4782:17)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4792:19)
      at TypeScriptParserMixin.parseExprSubscripts (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11081:23)
      at TypeScriptParserMixin.parseUpdate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11066:21)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11046:23)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9857:18)
      at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10899:61)
      at TypeScriptParserMixin.parseExprOps (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10904:23)
      at TypeScriptParserMixin.parseMaybeConditional (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10881:23)
      at TypeScriptParserMixin.parseMaybeAssign (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10831:21)
      at C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9795:39
      at TypeScriptParserMixin.tryParse (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:6938:20)
      at TypeScriptParserMixin.parseMaybeAssign (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9795:18)
      at C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10800:39
      at TypeScriptParserMixin.allowInAnd (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12432:12)
      at TypeScriptParserMixin.parseMaybeAssignAllowIn (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10800:17)
      at TypeScriptParserMixin.parseMaybeAssignAllowInOrVoidPattern (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12499:17)
      at TypeScriptParserMixin.parseParenAndDistinguishExpression (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11679:28)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11331:23)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4797:20)
      at TypeScriptParserMixin.parseExprSubscripts (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11081:23)
      at TypeScriptParserMixin.parseUpdate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11066:21)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11046:23)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9857:18)
      at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10899:61)
      at TypeScriptParserMixin.parseExprOpBaseRightExpr (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10986:34)
      at TypeScriptParserMixin.parseExprOpRightExpr (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10981:21)
      at TypeScriptParserMixin.parseExprOp (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10947:27)
23:53:04 [vite] (client) Pre-transform error: C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\src\pages\admin\AdminProductValidation.tsx: 'import' and 'export' may only appear at the top level. (357:0)

  355 | };
  356 |
> 357 | export default AdminProductValidation;
      | ^
  Plugin: vite:react-babel
  File: C:/Users/HP/Desktop/printalma-perso/printalma_website_dep/src/pages/admin/AdminProductValidation.tsx:357:0
23:53:05 [vite] Internal server error: C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\src\pages\admin\AdminProductValidation.tsx: 'import' and 'export' may only appear at the top level. (357:0)

  355 | };
  356 |
> 357 | export default AdminProductValidation;
      | ^
  Plugin: vite:react-babel
  File: C:/Users/HP/Desktop/printalma-perso/printalma_website_dep/src/pages/admin/AdminProductValidation.tsx:357:0
      at constructor (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:367:19)
      at TypeScriptParserMixin.raise (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:6630:19)
      at TypeScriptParserMixin.parseStatementContent (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12876:18)
      at TypeScriptParserMixin.parseStatementContent (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9532:18)
      at TypeScriptParserMixin.parseStatementLike (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12772:17)
      at TypeScriptParserMixin.parseStatementListItem (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12752:17)
      at TypeScriptParserMixin.parseBlockOrModuleBlockBody (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13321:61)
      at TypeScriptParserMixin.parseBlockBody (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13314:10)
      at TypeScriptParserMixin.parseBlock (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13302:10)
      at TypeScriptParserMixin.parseFunctionBody (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12106:24)
      at TypeScriptParserMixin.parseArrowExpression (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12081:10)
      at TypeScriptParserMixin.parseParenAndDistinguishExpression (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11691:12)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11331:23)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4797:20)
      at TypeScriptParserMixin.parseExprSubscripts (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11081:23)
      at TypeScriptParserMixin.parseUpdate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11066:21)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11046:23)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9857:18)
      at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10899:61)
      at TypeScriptParserMixin.parseExprOps (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10904:23)
      at TypeScriptParserMixin.parseMaybeConditional (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10881:23)
      at TypeScriptParserMixin.parseMaybeAssign (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10831:21)
      at TypeScriptParserMixin.parseMaybeAssign (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9806:20)
      at C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10800:39
      at TypeScriptParserMixin.allowInAnd (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12427:16)
      at TypeScriptParserMixin.parseMaybeAssignAllowIn (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10800:17)
      at TypeScriptParserMixin.parseVar (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13389:91)
      at TypeScriptParserMixin.parseVarStatement (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13235:10)
      at TypeScriptParserMixin.parseVarStatement (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9498:31)
      at TypeScriptParserMixin.parseStatementContent (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12856:23)
      at TypeScriptParserMixin.parseStatementContent (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9532:18)
      at TypeScriptParserMixin.parseStatementLike (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12772:17)
      at TypeScriptParserMixin.parseModuleItem (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12749:17)
      at TypeScriptParserMixin.parseBlockOrModuleBlockBody (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13321:36)
      at TypeScriptParserMixin.parseBlockBody (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13314:10)
      at TypeScriptParserMixin.parseProgram (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12630:10)
      at TypeScriptParserMixin.parseTopLevel (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12620:25)
      at TypeScriptParserMixin.parse (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:14497:10)
      at TypeScriptParserMixin.parse (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10149:18)
      at parse (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:14531:38)
      at parser (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\core\lib\parser\index.js:41:34)
      at parser.next (<anonymous>)
      at normalizeFile (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\core\lib\transformation\normalize-file.js:64:37)
      at normalizeFile.next (<anonymous>)
      at run (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\core\lib\transformation\index.js:22:50)
      at run.next (<anonymous>)
      at transform (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\core\lib\transform.js:22:33)
      at transform.next (<anonymous>)
      at step (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\gensync\index.js:261:32)
      at C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\gensync\index.js:273:13
Terminer le programme de commandes (O/N) ? o
PS C:\Users\HP\Desktop\printalma-perso\printalma_website_dep> npm run dev

> printalma_website@0.0.0 dev
> vite


  VITE v6.3.5  ready in 1072 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
23:53:40 [vite] (client) Pre-transform error: C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\src\pages\admin\AdminProductValidation.tsx: 'import' and 'export' may only appear at the top level. (357:0)

  355 | };
  356 |
> 357 | export default AdminProductValidation; 
      | ^
  Plugin: vite:react-babel
  File: C:/Users/HP/Desktop/printalma-perso/printalma_website_dep/src/pages/admin/AdminProductValidation.tsx:357:0
23:53:47 [vite] Internal server error: C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\src\pages\admin\AdminProductValidation.tsx: 'import' and 'export' may only appear at the top level. (357:0)

  355 | };
  356 |
> 357 | export default AdminProductValidation;
      | ^
  Plugin: vite:react-babel
  File: C:/Users/HP/Desktop/printalma-perso/printalma_website_dep/src/pages/admin/AdminProductValidation.tsx:357:0
      at constructor (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:367:19)
      at TypeScriptParserMixin.raise (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:6630:19)
      at TypeScriptParserMixin.parseStatementContent (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12876:18)
      at TypeScriptParserMixin.parseStatementContent (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9532:18)
      at TypeScriptParserMixin.parseStatementLike (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12772:17)
      at TypeScriptParserMixin.parseStatementListItem (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12752:17)
      at TypeScriptParserMixin.parseBlockOrModuleBlockBody (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13321:61)
      at TypeScriptParserMixin.parseBlockBody (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13314:10)
      at TypeScriptParserMixin.parseBlock (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13302:10)
      at TypeScriptParserMixin.parseFunctionBody (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12106:24)
      at TypeScriptParserMixin.parseArrowExpression (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12081:10)
      at TypeScriptParserMixin.parseParenAndDistinguishExpression (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11691:12)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11331:23)
      at TypeScriptParserMixin.parseExprAtom (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:4797:20)
      at TypeScriptParserMixin.parseExprSubscripts (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11081:23)
      at TypeScriptParserMixin.parseUpdate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11066:21)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:11046:23)
      at TypeScriptParserMixin.parseMaybeUnary (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9857:18)
      at TypeScriptParserMixin.parseMaybeUnaryOrPrivate (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10899:61)
      at TypeScriptParserMixin.parseExprOps (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10904:23)
      at TypeScriptParserMixin.parseMaybeConditional (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10881:23)
      at TypeScriptParserMixin.parseMaybeAssign (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10831:21)
      at TypeScriptParserMixin.parseMaybeAssign (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9806:20)
      at C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10800:39
      at TypeScriptParserMixin.allowInAnd (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12427:16)
      at TypeScriptParserMixin.parseMaybeAssignAllowIn (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10800:17)
      at TypeScriptParserMixin.parseVar (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13389:91)
      at TypeScriptParserMixin.parseVarStatement (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13235:10)
      at TypeScriptParserMixin.parseVarStatement (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9498:31)
      at TypeScriptParserMixin.parseStatementContent (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12856:23)
      at TypeScriptParserMixin.parseStatementContent (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:9532:18)
      at TypeScriptParserMixin.parseStatementLike (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12772:17)
      at TypeScriptParserMixin.parseModuleItem (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12749:17)
      at TypeScriptParserMixin.parseBlockOrModuleBlockBody (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13321:36)
      at TypeScriptParserMixin.parseBlockBody (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:13314:10)
      at TypeScriptParserMixin.parseProgram (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12630:10)
      at TypeScriptParserMixin.parseTopLevel (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:12620:25)
      at TypeScriptParserMixin.parse (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:14497:10)
      at TypeScriptParserMixin.parse (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:10149:18)
      at parse (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\parser\lib\index.js:14531:38)
      at parser (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\core\lib\parser\index.js:41:34)
      at parser.next (<anonymous>)
      at normalizeFile (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\core\lib\transformation\normalize-file.js:64:37)
      at normalizeFile.next (<anonymous>)
      at run (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\core\lib\transformation\index.js:22:50)
      at run.next (<anonymous>)
      at transform (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\@babel\core\lib\transform.js:22:33)
      at transform.next (<anonymous>)
      at step (C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\gensync\index.js:261:32)
      at C:\Users\HP\Desktop\printalma-perso\printalma_website_dep\node_modules\gensync\index.js:273:13