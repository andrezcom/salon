import Expert from '../models/expert';
import * as type from '../types.'

export async function getExpertsSrv() {
  try {
    const expertList = await Expert.find();
    return expertList;
  } catch (error) {
    throw new Error('Error fetching experts');
  }
}

export async function postExpertSrv(expert: type.Expert) {
  const newExpert = new Expert(expert)
  const expertCreated = await newExpert.save();
  return expertCreated
}


export async function putExpertSrv(expert: type.Expert) {
  const putExpert = new Expert(expert)
  await Expert.findByIdAndUpdate(putExpert._id, putExpert);
  return putExpert
}
