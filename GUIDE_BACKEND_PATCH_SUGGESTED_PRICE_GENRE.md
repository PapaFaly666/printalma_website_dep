# Guide backend — Persister suggestedPrice et genre sur PATCH /products/:id

Objectif: lorsque le frontend envoie un PATCH de produit, que les champs `suggestedPrice` (prix suggéré) et `genre` soient correctement validés, mappés et persistés en base, puis renvoyés dans les réponses GET.

## 1) Schéma base de données

Si ces colonnes n’existent pas encore:

```sql
-- PostgreSQL
ALTER TABLE products ADD COLUMN IF NOT EXISTS suggested_price NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS genre VARCHAR(16);

-- Optionnel: valeur par défaut de genre
UPDATE products SET genre = 'UNISEXE' WHERE genre IS NULL;
```

Remarque: adaptez les types/tailles selon votre SGBD. `NUMERIC(12,2)` convient bien pour les montants. Pour `genre`, vous pouvez utiliser un ENUM si vous préférez, sinon un VARCHAR suffit.

## 2) Modèle/Entity produit

Exemple TypeORM (NestJS / Node):

```ts
// product.entity.ts
@Column({ name: 'suggested_price', type: 'numeric', precision: 12, scale: 2, nullable: true })
suggestedPrice?: string; // TypeORM renvoie souvent numeric en string -> convertir au besoin

@Column({ name: 'genre', type: 'varchar', length: 16, nullable: true })
genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';
```

Si vous préférez que l’entity expose un `number` pour `suggestedPrice`, convertissez lors du mapping (voir §5).

## 3) DTOs (validation entrante)

```ts
// update-product.dto.ts
import { IsOptional, IsNumber, IsPositive, IsIn, IsString } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsNumber()
  // @IsPositive() // si vous voulez interdire 0 ou valeurs négatives
  suggestedPrice?: number;

  @IsOptional()
  @IsString()
  @IsIn(['HOMME', 'FEMME', 'BEBE', 'UNISEXE'])
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';

  // ... autres champs existants (name, price, stock, etc.)
}
```

Assurez-vous que votre contrôleur PATCH utilise bien ce DTO.

## 4) Contrôleur / Service (logique d’update)

Contrôleur (NestJS):

```ts
@Patch(':id')
async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
  return this.productsService.update(parseInt(id, 10), dto);
}
```

Service (mise à jour sélective):

```ts
async update(id: number, dto: UpdateProductDto) {
  const product = await this.repo.findOne({ where: { id } });
  if (!product) throw new NotFoundException('Product not found');

  if (dto.suggestedPrice !== undefined) {
    // Stocker tel quel; TypeORM numeric => string: product.suggestedPrice = dto.suggestedPrice as any;
    product.suggestedPrice = (dto.suggestedPrice as unknown as number) as any;
  }

  if (dto.genre !== undefined) {
    product.genre = dto.genre; // 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE'
  }

  // ... appliquer les autres champs (name, price, stock, etc.)

  await this.repo.save(product);
  return this.findOne(id); // renvoyer le produit normalisé
}
```

Express/Prisma ou autre ORM: appliquez la même logique en mappant les champs reçus vers les colonnes `suggested_price` et `genre`.

## 5) Normalisation entrée/sortie (camelCase/snake_case, numeric)

- Entrée: le frontend envoie `suggestedPrice` (camelCase) et `genre`.
- DB: la colonne est `suggested_price`. Mappez correctement côté ORM/DAO.
- Sortie: incluez `suggestedPrice` et `genre` dans la représentation JSON renvoyée (`GET /products`, `GET /products/:id`).
- Attention à `numeric` PostgreSQL retourné en string via certains ORMs. Normalisez si nécessaire:

```ts
function normalizeProduct(p: any) {
  return {
    ...p,
    suggestedPrice: p.suggestedPrice != null ? Number(p.suggestedPrice) : undefined,
  };
}
```

## 6) Exemple de tests rapides

PATCH (mise à jour prix suggéré + genre):

```bash
curl -X PATCH "https://<host>/products/2" \
  -H "Content-Type: application/json" \
  --cookie "<vos-cookies-d’auth>" \
  -d '{
    "suggestedPrice": 2000,
    "genre": "FEMME"
  }'
``;

GET pour vérifier:

```bash
curl "https://<host>/products/2" --cookie "<vos-cookies-d’auth>"
```

Vérifiez que la réponse contient:

```json
{
  "id": 2,
  "suggestedPrice": 2000,
  "genre": "FEMME",
  ...
}
```

## 7) Règles optionnelles

- Si `price` est omis et que `suggestedPrice` est défini, vous pouvez décider d’utiliser `suggestedPrice` comme valeur par défaut pour `price` lors de la création/édition.
- Validez que `genre` est toujours dans le set autorisé. Définissez un défaut `UNISEXE` côté DB ou service.

## 8) Checklist d’intégration

- [ ] Colonnes `suggested_price` et `genre` présentes (migration appliquée)
- [ ] Entity/Model met à disposition `suggestedPrice` et `genre`
- [ ] DTO PATCH accepte `suggestedPrice` (number) et `genre` (enum string)
- [ ] Service/Repository mappe et persiste les 2 champs
- [ ] GET renvoie bien ces champs (normalisés)
- [ ] Tests CURL/insomnia/postman OK

---

Référence frontend: le PATCH actuel envoie déjà `suggestedPrice` et `genre`. Une fois le backend aligné, les modifications seront visibles en base et dans les réponses GET.


