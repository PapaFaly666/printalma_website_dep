import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Eye, Package, Calendar, Tag, DollarSign, Search, RefreshCw, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { productValidationService } from '../../services/ProductValidationService';
import { ProductWithValidation, PaginatedResponse } from '../../types/validation';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';

export const AdminProductValidation: React.FC = () => {
  const [products, setProducts] = useState<ProductWithValidation[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithValidation | null>(null);
  const [validation, setValidation] = useState<{ approved: boolean | null, reason: string }>({ approved: null, reason: '' });
  const [processing, setProcessing] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res: PaginatedResponse<ProductWithValidation> = await productValidationService.getPendingProducts({ page: pagination.currentPage, limit: 20, search });
      setProducts(Array.isArray(res.data) ? res.data : (res.data as any).items || []);
      setPagination((res.data as any).pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (e: any) {
      toast.error(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [pagination.currentPage, search]);

  const handleValidate = async () => {
    if (!selectedProduct || validation.approved === null) return;
    if (!validation.approved && !validation.reason.trim()) {
      toast.error('Veuillez entrer une raison de rejet.');
      return;
    }
    setProcessing(true);
    try {
      await productValidationService.validateProduct(selectedProduct.id, validation.approved, validation.reason);
      toast.success(`Produit ${validation.approved ? 'approuvé' : 'rejeté'} !`);
      setSelectedProduct(null);
      setValidation({ approved: null, reason: '' });
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la validation');
    } finally {
      setProcessing(false);
    }
  };

  const StatsCard = ({ title, value, icon }: { title: string; value: any; icon: React.ReactNode; }) => (
    <Card className="p-4 border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-black">{value}</p>
        </div>
        {icon}
      </div>
    </Card>
  );

  const ProductCard: React.FC<{ product: ProductWithValidation }> = ({ product }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-gray-200 hover:border-black transition-shadow">
        <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
          <Package className="w-12 h-12 text-gray-400" />
          <div className="absolute top-2 left-2">
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center"><AlertTriangle className="h-3 w-3 mr-1"/>En attente</Badge>
          </div>
          <div className="absolute top-2 right-2">
            <Button variant="ghost" size="sm" className="bg-white/20 text-white" onClick={()=>setSelectedProduct(product)}>
              <Eye className="h-4 w-4"/>
            </Button>
          </div>
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
          <div className="text-sm text-gray-600 flex items-center"><DollarSign className="h-3 w-3 mr-1"/>{product.price.toLocaleString()} FCFA</div>
          <div className="flex flex-wrap gap-1">
            {((product as any).categories ?? []).slice(0,3).map((cat: any, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">{cat.name || cat}</Badge>
            ))}
            {(((product as any).categories?.length ?? 0) > 3) && (
              <Badge variant="outline" className="text-xs">+{((product as any).categories?.length ?? 0)-3}</Badge>
            )}
          </div>
          <Button className="w-full bg-green-600 text-white hover:bg-green-700" size="sm" onClick={()=>{setSelectedProduct(product);setValidation({approved:true,reason:''});}}><Check className="h-3 w-3 mr-1"/>Approuver</Button>
          <Button className="w-full mt-2" variant="destructive" size="sm" onClick={()=>{setSelectedProduct(product);setValidation({approved:false,reason:''});}}><X className="h-3 w-3 mr-1"/>Rejeter</Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-black">Validation des Produits</h1>
            <p className="text-gray-600">Examiner et valider les produits créés par les vendeurs</p>
          </div>
          <Button variant="outline" onClick={fetchProducts} disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading?'animate-spin':''}`}/>Actualiser</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard title="Total en attente" value={pagination.totalItems} icon={<Package className="h-6 w-6 text-gray-400"/>}/>
          <StatsCard title="Sur cette page" value={(products?.length ?? 0)} icon={<Eye className="h-6 w-6 text-gray-400"/>}/>
          <StatsCard title="Action requise" value={(products?.length ?? 0)>0?'Oui':'Non'} icon={<AlertTriangle className="h-6 w-6 text-yellow-600"/>}/>
        </div>
        <div className="mb-6 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4"/>
          <Input placeholder="Rechercher par nom..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-10"/>
        </div>
        <AnimatePresence mode="wait">
          {loading ? (
            <p>Chargement...</p>
          ) : (products?.length ?? 0) > 0 ? (
            <motion.div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" initial={{opacity:0}} animate={{opacity:1}}>
              {products.map(p=> <ProductCard key={p.id} product={p}/>)}
            </motion.div>
          ) : (
            <p className="text-center text-gray-600">Aucun produit en attente</p>
          )}
        </AnimatePresence>

        {/* Modal */}
        <Dialog open={!!selectedProduct} onOpenChange={()=>setSelectedProduct(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Validation produit</DialogTitle>
              <DialogDescription>{selectedProduct?.name}</DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Prix</Label>
                    <p>{selectedProduct.price.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <Label className="font-medium">Catégories</Label>
                    <p>{(selectedProduct as any).categories && (selectedProduct as any).categories.length>0 ? (selectedProduct as any).categories.map((c: any)=>c.name || c).join(', ') : '—'}</p>
                  </div>
                </div>
                {validation.approved === false && (
                  <div className="space-y-2">
                    <Label>Raison du rejet *</Label>
                    <Textarea value={validation.reason} onChange={e=>setValidation({...validation,reason:e.target.value})}/>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={()=>setSelectedProduct(null)}>Annuler</Button>
              {validation.approved===null ? null : (
                <Button onClick={handleValidate} disabled={processing || (validation.approved===false && !validation.reason.trim())} className={validation.approved?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'}>
                  {processing? 'Traitement...' : validation.approved ? 'Approuver' : 'Rejeter'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}; 