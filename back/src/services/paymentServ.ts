import Payment from '../models/payment';


export async function getPaymentsSrv() {
  try {
    const paymentList = await Payment.find();
    return paymentList;
  } catch (error) {
    throw new Error('Error fetching payments');
  }
}

export async function postPaymentSrv(payment: any) {
  const newPayment = new Payment(payment)
  const paymentCreated = await newPayment.save();
  return paymentCreated
}


export async function putPaymentSrv(payment: any) {
  const putPayment = new Payment(payment)
  await Payment.findByIdAndUpdate(putPayment._id, putPayment);
  return putPayment
}
