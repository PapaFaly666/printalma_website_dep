pfdev@PC:/mnt/c/Users/HP/Desktop/printalma-perso/printalma_website_dep$ npm run build

> printalma_website@0.0.0 build
> tsc -b && vite build

src/services/designService.ts:987:7 - error TS2322: Type 'number' is not assignable to type 'string'.

987       category: payload.categoryId, // Utilise category au lieu de categoryId
          ~~~~~~~~

  src/services/designService.ts:47:3
    47   category?: string;
         ~~~~~~~~
    The expected type comes from property 'category' which is declared here on type 'Design'       

src/services/designService.ts:1080:7 - error TS2322: Type 'number' is not assignable to type 'string'.

1080       category: payload.categoryId, // Utilise category au lieu de categoryId
           ~~~~~~~~

  src/services/designService.ts:47:3
    47   category?: string;
         ~~~~~~~~
    The expected type comes from property 'category' which is declared here on type 'Design'       


Found 2 errors.

pfdev@PC:/mnt/c/Users/HP/Desktop/printalma-perso/printalma_website_dep$