import Provider from '../models/provider';
import * as type from '../types.'

export async function getProvidersSrv() {
  try {
    const providerList = await Provider.find();
    return providerList;
  } catch (error) {
    throw new Error('Error fetching experts');
  }
}

export async function postProviderSrv(provider: type.Provider) {
  const newProvider = new Provider(provider)
  const providerCreated = await newProvider.save();
  return providerCreated
}


export async function putProviderSrv(provider: type.Provider) {
  const putProvider = new Provider(provider)
  await Provider.findByIdAndUpdate(putProvider._id, putProvider);
  return putProvider
}
