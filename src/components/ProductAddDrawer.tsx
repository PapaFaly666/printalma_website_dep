import React from 'react';
import Drawer from './Drawer';
import { useForm, FormProvider } from 'react-hook-form';
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { FormControl, FormDescription, FormItem, FormLabel } from "../components/ui/form";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import Button from "../components/ui/Button";

const ProductAddDrawer = ({ isOpen, onClose, onAddProduct }) => {
  const methods = useForm({
    defaultValues: {
      name: '',
      category: 'Mug',
      price: 0,
      stock: 0,
      featured: false,
      description: '',
      status: 'draft'
    }
  });

  const onSubmit = (data) => {
    onAddProduct(data);
    onClose();
    methods.reset();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center gap-4 mb-2">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ajouter un produit</h3>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-5 py-4">
          <FormItem>
            <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">Nom du produit</FormLabel>
            <FormControl>
              <Input
                placeholder="Nom du produit"
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white"
                {...methods.register("name")}
              />
            </FormControl>
          </FormItem>

          <div className="grid grid-cols-2 gap-4">
            <FormItem>
              <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">Catégorie</FormLabel>
              <Select {...methods.register("category")}>
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectItem value="Mug" className="text-gray-900 dark:text-gray-100">Mug</SelectItem>
                  <SelectItem value="T-Shirt" className="text-gray-900 dark:text-gray-100">T-Shirt</SelectItem>
                  <SelectItem value="Pull" className="text-gray-900 dark:text-gray-100">Pull</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">Prix (CFA)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0.00"
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white"
                  {...methods.register("price", { valueAsNumber: true })}
                />
              </FormControl>
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormItem>
              <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">Stock</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white"
                  {...methods.register("stock", { valueAsNumber: true })}
                />
              </FormControl>
            </FormItem>

            <FormItem className="flex flex-row items-end justify-between space-x-2">
              <div className="space-y-0.5">
                <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">Mis en avant</FormLabel>
                <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">Afficher en page d'accueil</FormDescription>
              </div>
              <FormControl>
                <Switch
                  {...methods.register("featured")}
                  className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                />
              </FormControl>
            </FormItem>
          </div>

          <FormItem>
            <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">Statut</FormLabel>
            <Select {...methods.register("status")}>
              <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectItem value="published" className="text-gray-900 dark:text-gray-100">Publié</SelectItem>
                <SelectItem value="draft" className="text-gray-900 dark:text-gray-100">Brouillon</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>

          <FormItem>
            <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Description du produit..."
                className="resize-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white"
                {...methods.register("description")}
                rows={3}
              />
            </FormControl>
          </FormItem>

          <div className="flex justify-end gap-3 mt-2">
            <Button 
              variant="outline" 
              className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" 
              onClick={onClose} 
              type="button"
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Ajouter le produit
            </Button>
          </div>
        </form>
      </FormProvider>
    </Drawer>
  );
};

export default ProductAddDrawer;