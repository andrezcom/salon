import User from '../../models/users';


export async function getUsersSrv() {
  try {
    const userList = await User.find();
    return userList;
  } catch (error) {
    throw new Error('Error fetching users');
  }
}

export async function postUserSrv(user: any) {
  const newUser = new User(user)
  const userCreated = await newUser.save();
  return userCreated
}


