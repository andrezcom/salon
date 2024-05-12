import Product from '../models/product';
import * as type from '../types.';


export async function getProductsSrv() {
  try {
    const productList = await Product.find();
    return productList;
  } catch (error) {
    throw new Error('Error fetching products');
  }
}

export async function postProductSrv(product: type.Product) {
  const newProduct = new Product(product)
  const productCreated = await newProduct.save();
  return productCreated
}


export async function putProductSrv(product: type.Product) {
  const putProduct = new Product(product)
  await Product.findByIdAndUpdate(putProduct._id, putProduct);
  return putProduct
}
