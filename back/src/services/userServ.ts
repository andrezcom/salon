import User from '../models/user';
import * as type from '../types.'
const bcrypt = require('bcryptjs');

export async function getUsersSrv() {
  try {
    const userList = await User.find();
    return userList;
  } catch (error) {
    throw new Error('Error fetching users');
  }
}

export async function postUserSrv(user: type.User) {
  const newUser = new User(user)
  const userCreated = await newUser.save();
  return userCreated
}

export async function loginUserSrv(user: type.User) {
  const userFound = await User.findOne({ email: user.email });
  if (!userFound) {
    throw new Error('There is error in user and password1')
  }
  const isMatch = bcrypt.compareSync(user.pass, userFound.pass);
  if (!isMatch) {
    throw new Error('There is error in user and password2')
  }
  return ({ success: 'login coreecto', user: userFound })
}

export async function putUserSrv(user: any) {
  const putUser = new User(user)
  await User.findByIdAndUpdate(putUser._id, putUser);
  return putUser
}

export async function deleteUserSrv(id: string) {
  try {
    const user = await User.findByIdAndDelete(id)
    return user
  } catch (error: unknown) {
    throw new Error('Error deleting user')
  }
}
