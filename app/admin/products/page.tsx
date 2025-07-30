'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { toast } from 'sonner';

type Product = {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: 'Perfume' | 'Eyewear' | 'Clothing' | 'Accessories' | 'Fragrance' | 'Jewelry' | 'Watches' | 'Footwear' | 'Gadgets' | 'Other';
  stock: number;
  images: string[];
  rating?: number;
  numReviews?: number;
  isFeatured?: boolean;
  details?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

type Category = 'Perfume' | 'Eyewear' | 'Clothing' | 'Accessories' | 'Fragrance' | 'Jewelry' | 'Watches' | 'Footwear' | 'Gadgets' | 'Other';

type ProductFormData = {
  title: string;
  description: string;
  price: number;
  category: Category;
  stock: number;
  images: string[];
  rating: number;
  numReviews: number;
  isFeatured: boolean;
  details: Map<string, any>;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const getInitialFormData = (): ProductFormData => ({
    title: '',
    description: '',
    price: 0,
    category: 'Clothing',
    stock: 0,
    images: [],
    rating: 0,
    numReviews: 0,
    isFeatured: false,
    details: new Map()
  });

  const [formData, setFormData] = useState<ProductFormData>(() => getInitialFormData());

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }
      
      setProducts(Array.isArray(data.data) ? data.data : []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    
    setFormData((prev: ProductFormData) => {
      // Create a new form data object with the current values
      const newFormData: ProductFormData = { ...prev };
      
      // Helper function to safely update form data
      const updateFormData = <K extends keyof ProductFormData>(
        key: K, 
        newValue: ProductFormData[K]
      ) => {
        newFormData[key] = newValue;
      };
      
      // Handle different input types
      if (type === 'number') {
        const numValue = parseFloat(value) || 0;
        if (name === 'price') updateFormData('price', numValue);
        else if (name === 'stock') updateFormData('stock', numValue);
        else if (name === 'rating') updateFormData('rating', numValue);
        else if (name === 'numReviews') updateFormData('numReviews', numValue);
      } else if (name === 'category') {
        // Type-safe category update
        const validCategories = [
          'Perfume', 'Eyewear', 'Clothing', 'Accessories', 
          'Fragrance', 'Jewelry', 'Watches', 'Footwear', 
          'Gadgets', 'Other'
        ] as const satisfies readonly Category[];
        
        const category = validCategories.includes(value as Category) 
          ? value as Category 
          : 'Other';
          
        updateFormData('category', category);
      } else if (name === 'isFeatured') {
        updateFormData('isFeatured', (target as HTMLInputElement).checked);
      } else if (name === 'details') {
        try {
          const parsedDetails = JSON.parse(value);
          if (parsedDetails && typeof parsedDetails === 'object') {
            updateFormData('details', new Map(Object.entries(parsedDetails)));
          }
        } catch (e) {
          console.error('Invalid JSON for details:', e);
        }
      } else if (name === 'title') {
        updateFormData('title', value);
      } else if (name === 'description') {
        updateFormData('description', value);
      } else if (name === 'images') {
        // Handle images array updates if needed
        updateFormData('images', Array.isArray(value) ? value : [value]);
      }
      
      console.log(`Updating ${name}:`, { 
        oldValue: prev[name as keyof ProductFormData],
        newValue: newFormData[name as keyof ProductFormData]
      });
      
      return newFormData;
    });
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check total number of images won't exceed a reasonable limit (e.g., 10)
    const MAX_IMAGES = 10;
    if (formData.images.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    try {
      const formData = new FormData();
      
      // Add files to form data
      Array.from(files).forEach((file, index) => {
        formData.append(`file`, file);
      });
      
      // Show loading toast
      const toastId = toast.loading('Uploading images...');
      
      try {
        // Send to our API endpoint
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to upload images');
        }
        
        if (result.success && result.data && result.data.length > 0) {
          // Update form data with new image URLs
          const newImageUrls = result.data.map((item: { url: string }) => item.url);
          
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...newImageUrls]
          }));
          
          // Show success message
          toast.success(
            newImageUrls.length === 1 
              ? '1 image uploaded successfully' 
              : `${newImageUrls.length} images uploaded successfully`,
            { id: toastId }
          );
        } else {
          throw new Error('No images were uploaded');
        }
      } catch (error) {
        console.error('Error uploading images:', error);
        toast.error('Failed to upload some images', { id: toastId });
      }
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Failed to process some images');
    } finally {
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      ...getInitialFormData(),
      title: product.title,
      description: product.description || '',
      price: product.price || 0,
      category: product.category || 'Other',
      stock: product.stock || 0,
      images: product.images || [],
      rating: product.rating || 0,
      numReviews: product.numReviews || 0,
      isFeatured: Boolean(product.isFeatured) || false,
      details: product.details ? new Map(Object.entries(product.details)) : new Map()
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete product');
      }

      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Please enter a product title');
      return;
    }
    
    if (!formData.images || formData.images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare the product data
      const productData = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price) || 0,
        category: formData.category,
        stock: Number(formData.stock) || 0,
        images: formData.images,
        rating: Number(formData.rating) || 0,
        numReviews: Number(formData.numReviews) || 0,
        isFeatured: Boolean(formData.isFeatured) || false,
        details: formData.details ? Object.fromEntries(formData.details) : {}
      };
      
      console.log('Submitting product:', productData);
      
      const url = isEditing && currentProduct?._id 
        ? `/api/products/${currentProduct._id}`
        : '/api/products';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'save'} product`);
      }
      
      const result = await response.json();
      console.log('Product saved:', result);
      
      // Reset form and close modal
      setFormData(getInitialFormData());
      setIsModalOpen(false);
      fetchProducts();
      toast.success(`Product ${isEditing ? 'updated' : 'saved'} successfully!`);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'save'} product`);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentProduct(null);
    setFormData({
      ...getInitialFormData(),
      title: 'New Product',
      category: 'Clothing'
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Products</h1>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] h-[90vh] max-h-[90vh] p-0 flex flex-col font-sans antialiased">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle className="text-xl">{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription className="text-sm">
              {isEditing ? 'Update the product details below.' : 'Fill in the product details below to add a new product.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">Product Name *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
                <Select
                  name="category"
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as Category }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Perfume">Perfume</SelectItem>
                    <SelectItem value="Eyewear">Eyewear</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                    <SelectItem value="Fragrance">Fragrance</SelectItem>
                    <SelectItem value="Jewelry">Jewelry</SelectItem>
                    <SelectItem value="Watches">Watches</SelectItem>
                    <SelectItem value="Footwear">Footwear</SelectItem>
                    <SelectItem value="Gadgets">Gadgets</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stock" className="text-sm font-medium text-gray-700">Stock *</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-sm font-medium text-gray-700">Product Images</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-md flex flex-col items-center justify-center h-32 hover:border-gray-400 transition-colors"
                  >
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Add Images</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                      multiple
                      name="images"
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-sm font-medium text-gray-700">Featured Product</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                  />
                  <Label htmlFor="isFeatured">Featured Product</Label>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="details" className="text-sm font-medium text-gray-700">Additional Details (JSON)</Label>
                <Textarea
                  id="details"
                  value={JSON.stringify(Object.fromEntries(formData.details), null, 2)}
                  onChange={(e) => {
                    try {
                      const details = new Map(Object.entries(JSON.parse(e.target.value)));
                      setFormData(prev => ({ ...prev, details }));
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"color": "red", "size": "M"}'
                  className="min-h-[100px] font-mono text-sm"
                />
                <p className="text-xs text-gray-500">Enter additional details as a JSON object</p>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-background border-t p-4 mt-4 -mx-6 -mb-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Product' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow overflow-hidden h-[calc(100vh-200px)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            className="h-10 w-10 rounded-md object-cover" 
                            src={product.images?.[0] || '/placeholder-product.jpg'} 
                            alt={product.title} 
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      NGN{product.price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.stock > 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          In Stock
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No products found. Add your first product to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
