import React from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="card" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      transition: 'transform 0.2s ease',
      cursor: 'default'
    }}>
      {/* Book Cover Placeholder */}
      <div style={{ 
        height: '180px', 
        backgroundColor: '#f1f5f9', 
        borderRadius: '4px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '15px',
        color: '#94a3b8',
        fontSize: '40px'
      }}>
        📖
      </div>

      {/* Content - Now just the Caption */}
      <div style={{ flex: 1, marginBottom: '15px' }}>
        <p style={{ 
          margin: '0', 
          color: '#334155', 
          fontSize: '15px', 
          lineHeight: '1.5',
          // These lines clamp the text to 3 lines max
          display: '-webkit-box',
          WebkitLineClamp: '3',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {product.caption}
        </p>
      </div>

      {/* Footer: Price & Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
          ${product.price.toFixed(2)}
        </span>
        <button onClick={() => onAddToCart(product)} style={{ fontSize: '14px' }}>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;