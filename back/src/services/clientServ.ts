import Client from '../models/client';

export async function getClientsSrv() {
  try {
    const clientList = await Client.find();
    return clientList;
  } catch (error) {
    throw new Error('Error fetching experts');
  }
}

export async function postClientSrv(client: any) {
  const newClient = new Client(client)
  const clientCreated = await newClient.save();
  return clientCreated
}


export async function putClientSrv(client: any) {
  const putClient = new Client(client)
  await Client.findByIdAndUpdate(putClient._id, putClient);
  return putClient
}
