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
      
      {/* IMAGE SECTION */}
      <div style={{ 
        height: '180px', 
        marginBottom: '15px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        overflow: 'hidden', // Ensures image doesn't spill out
        borderRadius: '4px',
        backgroundColor: '#f8fafc'
      }}>
        {product.image ? (
          // ✅ CASE A: Real Image exists
          <img 
            src={product.image} 
            alt={product.caption} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain' // Keeps aspect ratio (doesn't stretch)
            }}
            // Fallback: If image fails to load, hide it (or show box)
            onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerText = '📦'; }}
          />
        ) : (
          // ✅ CASE B: No Image URL (Fallback to Box)
          <div style={{ color: '#94a3b8', fontSize: '40px' }}>📦</div>
        )}
      </div>

      {/* CAPTION SECTION */}
      <div style={{ flex: 1, marginBottom: '15px' }}>
        <p style={{ 
          margin: '0', 
          color: '#334155', 
          fontSize: '15px', 
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: '3',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {product.caption}
        </p>
      </div>

      {/* FOOTER */}
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