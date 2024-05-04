import Sale from '../models/sale';


export async function getSalesSrv() {
  try {
    const saleList = await Sale.find();
    return saleList;
  } catch (error) {
    throw new Error('Error fetching sales');
  }
}

export async function postSaleSrv(sale: any) {
  const newSale = new Sale(sale)
  const saleCreated = await newSale.save();
  return saleCreated
}


export async function putSaleSrv(sale: any) {
  const putSale = new Sale(sale)
  await Sale.findByIdAndUpdate(putSale._id, putSale);
  return putSale
}
