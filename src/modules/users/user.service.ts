import User from "./user.model";

export class UserService {
  async getAllUsers() {
    return User.find();
  }

  async getUserById(id: string) {
    return User.findById(id);
  }

  async createUser(userData: any) {
    const user = new User(userData);
    return user.save();
  }

  async updateUser(id: string, userData: any) {
    return User.findByIdAndUpdate(
      id,
      { $set: userData },
      { new: true, runValidators: true }
    );
  }

  async deleteUser(id: string) {
    return User.findByIdAndDelete(id);
  }
}

export const userService = new UserService();
