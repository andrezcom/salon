import Service from '../models/service';
import * as type from '../types.'

export async function getServicesSrv() {
  try {
    const serviceList = await Service.find();
    return serviceList;
  } catch (error) {
    throw new Error('Error fetching services');
  }
}

export async function postServiceSrv(service: type.Service) {
  const newService = new Service(service)
  const serviceCreated = await newService.save();
  return serviceCreated
}


export async function putServiceSrv(service: type.Service) {
  const putService = new Service(service)
  await Service.findByIdAndUpdate(putService._id, putService);
  return putService
}
