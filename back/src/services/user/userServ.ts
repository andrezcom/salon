import { user } from '../../models/users';


export async function getUsersSrv() {
  try {
    const userList = await user.find();
    return userList;
  } catch (error) {
    throw new Error('Error fetching users');
  }
}

export async function postUserSrv(User: any) {
  const newUser = new user(User)
  const userCreated = await newUser.save();
  return userCreated
}


