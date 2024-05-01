import Service from '../models/service';


export async function getServicesSrv() {
  try {
    const serviceList = await Service.find();
    return serviceList;
  } catch (error) {
    throw new Error('Error fetching services');
  }
}

export async function postServiceSrv(service: any) {
  const newService = new Service(service)
  const serviceCreated = await newService.save();
  return serviceCreated
}


export async function putServiceSrv(service: any) {
  const putService = new Service(service)
  await Service.findByIdAndUpdate(putService._id, putService);
  return putService
}
