const FONTS = { 
    ProductSans: { 
        bold: 'Product-Sans-Bold', 
        regular: 'Product-Sans-Regular' 
    } 
} as const; // <-- Adding 'as const' ensures strict string literal types

export { FONTS };