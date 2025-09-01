# 🛠️ Guide Backend – Synchronisation des Positions de Design

> Donnez ce document à votre développeur backend. Il décrit **pas à pas** comment garantir que les positions isolées enregistrées par le frontend (page `sell-design`) soient correctement renvoyées et consommées dans la liste `vendor/products`.

---

## 1. Contexte

1. Sur la page **/vendeur/sell-design** le frontend enregistre désormais la position du design par appel :
   ```http
   PUT /api/vendor-products/:vendorProductId/designs/:designId/position/direct
   ```
   Payload typique :
   ```json
   {
     "x": -12,
     "y": 4,
     "scale": 0.35,
     "rotation": 0,
     "constraints": { "adaptive": true, "area": "design-placement" }
   }
   ```
2. Lors de l'affichage de la liste **/vendeur/products** le frontend tente ensuite :
   ```http
   GET /api/vendor-products/:vendorProductId/designs/:designId/position/direct
   ```
   Or aujourd'hui cette requête répond `{ success: true, data: null }` ➜ le design revient donc à la position 0,0.

## 2. Objectif

Mettre en place le **stockage**, la **lecture** et le **mapping** corrects afin que :
- La sauvegarde via `PUT` enregistre (création ou update) la position dans la DB.
- Le `GET` renvoie exactement la même position.
- Les IDs reçus côté backend peuvent être :
  * `vendorProductId` réel (ex. 63) – cas standard ✅
  * ou un ancien `baseProductId` (ex. 2) – cas fallback (géré dans un précédent guide) ✅

## 3. Modèle SQL recommandé

```sql
CREATE TABLE IF NOT EXISTS vendor_design_positions (
  id SERIAL PRIMARY KEY,
  vendor_product_id INTEGER NOT NULL REFERENCES vendor_products(id) ON DELETE CASCADE,
  design_id INTEGER NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  scale NUMERIC NOT NULL DEFAULT 1,
  rotation NUMERIC NOT NULL DEFAULT 0,
  constraints JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (vendor_product_id, design_id)
);
```

## 4. Endpoints à implémenter

### 4.1 `GET /api/vendor-products/:vpId/designs/:designId/position/direct`

```ts
@Controller('api')
export class VendorDesignPositionController {
  constructor(private readonly service: VendorDesignPositionService) {}

  @Get('vendor-products/:vpId/designs/:designId/position/direct')
  async getPosition(
    @Param('vpId') vpId: number,
    @Param('designId') designId: number,
    @Req() req: Request
  ) {
    const vendorId = req.user.id; // auth guard
    const position = await this.service.getPosition(vendorId, vpId, designId);
    return { success: true, data: position };
  }

  @Put('vendor-products/:vpId/designs/:designId/position/direct')
  async savePosition(
    @Param('vpId') vpId: number,
    @Param('designId') designId: number,
    @Body() dto: PositionDto,
    @Req() req: Request
  ) {
    const vendorId = req.user.id;
    await this.service.savePosition(vendorId, vpId, designId, dto);
    return { success: true };
  }
}
```

### 4.2 Service

```ts
@Injectable()
export class VendorDesignPositionService {
  constructor(
    @InjectRepository(VendorProduct)
    private readonly vpRepo: Repository<VendorProduct>,
    @InjectRepository(VendorDesignPosition)
    private readonly posRepo: Repository<VendorDesignPosition>
  ){}

  /** 🔎 Lecture */
  async getPosition(vendorId: number, vpId: number, designId: number) {
    let vendorProduct = await this.vpRepo.findOne({ where: { id: vpId, vendorId } });

    /* 1️⃣ Fallback baseProductId → vendorProductId  */
    if (!vendorProduct) {
      vendorProduct = await this.vpRepo.findOne({ where: { baseProductId: vpId, vendorId } });
      if (vendorProduct) {
        vpId = vendorProduct.id;
      }
    }
    if (!vendorProduct) {
      return null; // Front traitera data:null
    }

    const record = await this.posRepo.findOne({ where: { vendorProductId: vpId, designId } });
    return record ? {
      x: record.x,
      y: record.y,
      scale: record.scale,
      rotation: record.rotation,
      constraints: record.constraints
    } : null;
  }

  /** 💾 Sauvegarde */
  async savePosition(vendorId: number, vpId: number, designId: number, pos: PositionDto) {
    // Sécurité: vérifier l'appartenance du produit au vendeur
    const product = await this.vpRepo.findOne({ where: { id: vpId, vendorId } });
    if (!product) {
      // Vérifier fallback baseProductId
      const byBase = await this.vpRepo.findOne({ where: { baseProductId: vpId, vendorId } });
      if (byBase) vpId = byBase.id; else throw new ForbiddenException('Produit introuvable');
    }

    await this.posRepo.save({
      vendorProductId: vpId,
      designId,
      x: pos.x,
      y: pos.y,
      scale: pos.scale,
      rotation: pos.rotation,
      constraints: pos.constraints,
      updatedAt: () => 'NOW()'
    });
  }
}
```

### DTO
```ts
export class PositionDto {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  constraints?: Record<string, any>;
}
```

## 5. Validation & Tests

1. **Postman / curl**
   ```bash
   # Sauvegarde
   PUT /api/vendor-products/63/designs/11/position/direct
   {"x":-15,"y":4,"scale":0.35,"rotation":0,"constraints":{}}
   
   # Lecture
   GET /api/vendor-products/63/designs/11/position/direct
   → {"success":true,"data":{…}}
   ```
2. **Migration automatique** :
   *Si vous aviez déjà les données dans `vendor_design_transforms` (index 0)*, exécutez :
   ```sql
   INSERT INTO vendor_design_positions (vendor_product_id, design_id, x, y, scale, rotation, constraints)
   SELECT vp.id, t.design_id, t.x, t.y, t.scale, t.rotation, '{"migrated":true}'::jsonb
   FROM vendor_design_transforms t
   JOIN vendor_products vp ON vp.base_product_id = t.base_product_id AND vp.vendor_id = t.vendor_id
   WHERE t.index = 0;
   ```

3. **E2E Cypress** :
   - Charger /save sur `/sell-design` ➜ attendre 200.  
   - Recharger `/vendor/products` ➜ capturer screenshot ; comparer (pixel diff < 2 %).

4. **Logs debug** : si aucune position, renvoyer `data:null`. Facultatif : ajouter `debugInfo` avec `suggestion` comme déjà fait pour productId.

---

## 6. Résultat attendu

✔️ La vignette dans **/vendor/products** affiche le design exactement à la place définie dans **/sell-design** (y compris après F5).  
✔️ Les appels réseau suivent toujours le schéma direct (plus d'appel legacy `vendor/design-transforms/save`).  
✔️ Vous pouvez supprimer progressivement la table `vendor_design_transforms`.

---

**Bon dev !** 🚀 