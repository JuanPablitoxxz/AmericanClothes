import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, ProductStatus } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSaveProduct: (productData: Omit<Product, 'id'> & { id?: string }) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSaveProduct,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [category, setCategory] = useState<ProductCategory>('Hombre');
  const [status, setStatus] = useState<ProductStatus>('ACTIVO');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [sizesStr, setSizesStr] = useState('S, M, L, XL');
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('upload');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setPrice(productToEdit.price);
      setStock(productToEdit.stock);
      setCategory(productToEdit.category);
      setStatus(productToEdit.status);
      setImage(productToEdit.image);
      setDescription(productToEdit.description);
      setSizesStr(productToEdit.sizes && productToEdit.sizes.length > 0 ? productToEdit.sizes.join(', ') : 'Única');
    } else {
      setName('');
      setSku(`AMC-${Math.floor(100 + Math.random() * 900)}`);
      setPrice(450000);
      setStock(15);
      setCategory('Hombre');
      setStatus('ACTIVO');
      setImage(
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDe8JFelISU8TiNUjGi_bscGbRRuZpQiYRbbmzoOXJGdEweGYCQsVwHdSkmR5m0X9qGyvvjN6MOPPCBsB61M1Uscn_4bwQ_XZsK5eKqjyfEZTo3op4zYnD5RRjkzwS35Cp9SwUaJi2lXSYL8Yotxim3wDveH8LLeMT1q3pYSEepnYqECKV766_obVtzw5ToXAI4JHqAHH94pM3_xOG-gb8Z6UzG0z0nfm_jypx5-3YEGCLGdXxdqfPr'
      );
      setDescription('Pieza de edición limitada confeccionada por American Clothes en Colombia.');
      setSizesStr('S, M, L, XL');
    }
  }, [productToEdit, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSizes = sizesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSaveProduct({
      id: productToEdit ? productToEdit.id : undefined,
      name,
      sku,
      price: Number(price),
      stock: Number(stock),
      category,
      status,
      image: image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
      description,
      sizes: parsedSizes.length > 0 ? parsedSizes : ['Única'],
      featured: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div
        className="bg-[#F9F8F6] border border-black/10 max-w-2xl w-full p-6 md:p-8 space-y-6 text-[#1A1A1A] max-h-[90vh] overflow-y-auto relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-black/10 pb-4">
          <div>
            <span className="sub-headline block mb-1">
              {productToEdit ? 'EDICIÓN DE PIEZA' : 'NUEVO REGISTRO'}
            </span>
            <h2 className="font-serif-display text-2xl font-normal text-[#1A1A1A]">
              {productToEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#1A1A1A] hover:text-[#555555]">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">Nombre del Producto</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              />
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">SKU</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">Precio (COP)</label>
              <input
                type="number"
                step="1000"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              />
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">Stock (Unidades)</label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              />
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="STOCK BAJO">STOCK BAJO</option>
                <option value="PAUSADO">PAUSADO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
              >
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Accesorios">Accesorios</option>
                <option value="Archivo">Archivo</option>
              </select>
            </div>

            <div>
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">
                Tallas Disponibles (separadas por coma)
              </label>
              <input
                type="text"
                placeholder="ej: S, M, L, XL ó Única"
                value={sizesStr}
                onChange={(e) => setSizesStr(e.target.value)}
                className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-2 border border-black/10 p-3 bg-[#EFECE7]/60">
            <div className="flex justify-between items-center">
              <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block">
                Fotografía de la Pieza
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImageUploadMode('upload')}
                  className={`px-2 py-1 text-[10px] font-label-caps tracking-[1px] transition-colors ${
                    imageUploadMode === 'upload' ? 'bg-[#1A1A1A] text-white font-bold' : 'bg-black/5 text-[#555]'
                  }`}
                >
                  Subir Archivo
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('url')}
                  className={`px-2 py-1 text-[10px] font-label-caps tracking-[1px] transition-colors ${
                    imageUploadMode === 'url' ? 'bg-[#1A1A1A] text-white font-bold' : 'bg-black/5 text-[#555]'
                  }`}
                >
                  Enlace URL
                </button>
              </div>
            </div>

            {imageUploadMode === 'upload' ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-[#1A1A1A] file:mr-3 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-label-caps file:font-bold file:tracking-[1px] file:bg-[#1A1A1A] file:text-[#F9F8F6] hover:file:bg-[#333] cursor-pointer"
                />
              </div>
            ) : (
              <input
                type="url"
                placeholder="https://ejemplo.com/foto.jpg"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full bg-[#F9F8F6] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none font-mono text-[10px]"
              />
            )}

            {image && (
              <div className="flex items-center justify-between p-2 bg-[#F9F8F6] border border-black/10 mt-2">
                <div className="flex items-center gap-3">
                  <img src={image} alt="Preview" className="w-12 h-14 object-cover bg-[#D6D2CC]" />
                  <span className="text-[10px] text-[#555555] font-mono">Vista previa cargada</span>
                </div>
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="text-xs text-red-600 hover:underline px-2 py-1"
                >
                  Quitar imagen
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="font-label-caps text-[10px] text-[#888888] tracking-[2px] block mb-1">Descripción</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#EFECE7] border border-black/10 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
            />
          </div>

          {image && (
            <div className="flex items-center gap-3 p-2 bg-[#EFECE7] border border-black/10">
              <img src={image} alt="Preview" className="w-12 h-16 object-cover bg-[#D6D2CC]" />
              <span className="text-[10px] text-[#888888] font-mono">Vista previa de imagen</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-black/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-black/10 bg-[#EFECE7] text-xs font-label-caps text-[#1A1A1A] tracking-[2px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#1A1A1A] text-[#F9F8F6] text-xs font-label-caps font-bold uppercase tracking-[2px] hover:bg-[#333333]"
            >
              {productToEdit ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
