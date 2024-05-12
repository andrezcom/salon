import Payment from '../models/payment';
import * as type from '../types.'


export async function getPaymentsSrv() {
  try {
    const paymentList = await Payment.find();
    return paymentList;
  } catch (error) {
    throw new Error('Error fetching payments');
  }
}

export async function postPaymentSrv(payment: type.Payment) {
  const newPayment = new Payment(payment)
  const paymentCreated = await newPayment.save();
  return paymentCreated
}


export async function putPaymentSrv(payment: type.Payment) {
  const putPayment = new Payment(payment)
  await Payment.findByIdAndUpdate(putPayment._id, putPayment);
  return putPayment
}
