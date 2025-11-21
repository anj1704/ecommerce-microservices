import React from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div style={{ 
      border: '1px solid #ddd', 
      padding: '15px', 
      borderRadius: '8px', 
      width: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Image Placeholder - In real app, use product.image_url */}
      <div style={{ height: '150px', background: '#f0f0f0', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#888' }}>Book Cover</span>
      </div>

      <div>
        <h3 style={{ fontSize: '16px', margin: '0 0 5px 0' }}>{product.title}</h3>
        <p style={{ color: '#555', fontSize: '14px', margin: '0 0 10px 0' }}>{product.author}</p>
        <p style={{ fontWeight: 'bold', color: '#2c3e50' }}>${product.price}</p>
      </div>

      <button 
        onClick={() => onAddToCart(product)}
        style={{ 
          marginTop: '10px', 
          padding: '8px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;