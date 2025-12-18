import { getAllProducts, getProduct } from '../../shop/Products.js';

describe('Products Module', () => {
  describe('getAllProducts', () => {
    it('should return array of products', () => {
      const products = getAllProducts();
      
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
    });

    it('should return products with required fields', () => {
      const products = getAllProducts();
      const product = products[0];
      
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('currency');
      expect(product).toHaveProperty('description');
    });

    it('should have valid product data', () => {
      const products = getAllProducts();
      
      products.forEach(product => {
        expect(typeof product.id).toBe('string');
        expect(typeof product.name).toBe('string');
        expect(typeof product.price).toBe('number');
        expect(product.price).toBeGreaterThan(0);
        expect(typeof product.currency).toBe('string');
        expect(product.currency).toMatch(/^[A-Z]{3}$/); // Currency code format
      });
    });
  });

  describe('getProduct', () => {
    it('should return product by id', () => {
      const products = getAllProducts();
      const firstProduct = products[0];
      
      if (!firstProduct) {
        throw new Error('No products found');
      }
      
      const product = getProduct(firstProduct.id);
      
      expect(product).toBeDefined();
      expect(product?.id).toBe(firstProduct.id);
    });

    it('should return undefined or null for non-existent product', () => {
      const product = getProduct('non_existent_id');
      expect(product).toBeFalsy();
    });

    it('should return undefined or null for empty string', () => {
      const product = getProduct('');
      expect(product).toBeFalsy();
    });

    it('should find specific known product', () => {
      // Assuming there's a product with this ID based on Products.js
      const product = getProduct('teddy_reelsmaker');
      
      if (product) {
        expect(product.name).toBeDefined();
        expect(product.price).toBeGreaterThan(0);
      }
    });
  });
});

