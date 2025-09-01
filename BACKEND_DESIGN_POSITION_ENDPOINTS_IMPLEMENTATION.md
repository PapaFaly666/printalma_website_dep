# 🚀 Guide Backend – Endpoints *Design Position* (isolation par produit)

> Version courte destinée au développeur backend pour corriger la réponse `data:null` et faire en sorte que le frontend récupère la bonne position du design.

---

## 1. Objectif

1. **Sauvegarder** la position d'un design pour un *VendorProduct* donné.
2. **Restituer** exactement la même position lors de la lecture.

Route cible côté front :
```
GET /api/vendor-products/:vendorProductId/designs/:designId/position/direct
PUT /api/vendor-products/:vendorProductId/designs/:designId/position/direct
```

---

## 2. Modèle SQL recommandé

```sql
CREATE TABLE IF NOT EXISTS vendor_design_positions (
  id SERIAL PRIMARY KEY,
  vendor_product_id INTEGER NOT NULL REFERENCES vendor_products(id) ON DELETE CASCADE,
  design_id         INTEGER NOT NULL REFERENCES designs(id)         ON DELETE CASCADE,
  x       NUMERIC NOT NULL DEFAULT 0,
  y       NUMERIC NOT NULL DEFAULT 0,
  scale   NUMERIC NOT NULL DEFAULT 1,
  rotation NUMERIC NOT NULL DEFAULT 0,
  constraints JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (vendor_product_id, design_id)
);
```

> Si vous avez encore les anciennes données (`vendor_design_transforms` index 0) utilisez le script de migration du guide long.

---

## 3. DTO côté NestJS
```ts
export class PositionDto {
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  constraints?: Record<string, any>;
}
```

---

## 4. Controller
```ts
@Controller('api')
export class VendorDesignPositionController {
  constructor(private readonly service: VendorDesignPositionService) {}

  @Put('vendor-products/:vpId/designs/:designId/position/direct')
  async save(
    @Param('vpId') vpId: number,
    @Param('designId') designId: number,
    @Body() dto: PositionDto,
    @Req() req: Request,
  ) {
    await this.service.savePosition(req.user.id, vpId, designId, dto);
    return { success: true, message: 'Position sauvegardée' };
  }

  @Get('vendor-products/:vpId/designs/:designId/position/direct')
  async read(
    @Param('vpId') vpId: number,
    @Param('designId') designId: number,
    @Req() req: Request,
  ) {
    const pos = await this.service.getPosition(req.user.id, vpId, designId);
    return { success: true, data: pos };
  }
}
```

---

## 5. Service (essentiel)
```ts
@Injectable()
export class VendorDesignPositionService {
  constructor(
    @InjectRepository(VendorProduct)
    private readonly vpRepo: Repository<VendorProduct>,
    @InjectRepository(VendorDesignPosition)
    private readonly posRepo: Repository<VendorDesignPosition>,
  ) {}

  /* Lecture */
  async getPosition(vendorId: number, vpId: number, designId: number) {
    vpId = await this.mapBaseToVendor(vendorId, vpId);
    if (!vpId) return null;
    const rec = await this.posRepo.findOne({ where: { vendorProductId: vpId, designId } });
    return rec ? {
      x: rec.x, y: rec.y, scale: rec.scale, rotation: rec.rotation, constraints: rec.constraints,
    } : null;
  }

  /* Sauvegarde */
  async savePosition(vendorId: number, vpId: number, designId: number, dto: PositionDto) {
    vpId = await this.mapBaseToVendor(vendorId, vpId, true);
    await this.posRepo.save({
      vendorProductId: vpId,
      designId,
      ...dto,
      updatedAt: () => 'NOW()',
    });
  }

  /* Helper : gère le fallback baseProductId → vendorProductId */
  private async mapBaseToVendor(vendorId: number, anyId: number, throwIfNotFound = false): Promise<number | null> {
    const vp = await this.vpRepo.findOne({ where: { id: anyId, vendorId } });
    if (vp) return vp.id;
    const byBase = await this.vpRepo.findOne({ where: { baseProductId: anyId, vendorId } });
    if (byBase) return byBase.id;
    if (throwIfNotFound) throw new ForbiddenException('Produit introuvable');
    return null;
  }
}
```

---

## 6. Tests Postman rapides
```http
PUT /api/vendor-products/64/designs/11/position/direct
{ "x": -15, "y": 4, "scale": 0.35, "rotation": 0 }

GET /api/vendor-products/64/designs/11/position/direct
→ { success:true, data:{ x:-15, y:4, scale:0.35, rotation:0 } }
```

---

## 7. Checklist « Done »
- [ ] Table créée et migrée ?  (`SELECT COUNT(*) FROM vendor_design_positions;`)
- [ ] PUT retourne **200** ? (vérifier `updated_at`)
- [ ] GET renvoie l'objet JSON complet ? (pas `data:null`)
- [ ] Frontend affiche enfin la position enregistrée.

> Quand ces quatre cases sont cochées, le bug côté front disparaît 🎉 