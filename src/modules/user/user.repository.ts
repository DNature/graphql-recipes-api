import bcrypt from 'bcryptjs'
import { PayloadUser } from 'src/utils/types/payload-user.interface'
import { Service } from 'typedi'
import { EntityRepository, Repository } from 'typeorm'
import { LoginInput } from './types/login-input.type'
import { UserInput } from './types/user-input.type'
import { User } from './user.entity'

@Service()
@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async findUser(id: number): Promise<User> {
    const foundUser = await this.findOne(id)

    if (!foundUser) {
      throw new Error(`User not found found`)
    }

    return foundUser
  }

  async createUser(userInput: UserInput): Promise<User> {
    const { name, email, password } = userInput

    const user = new User()

    user.name = name
    user.email = email
    user.password = await this.hashPassword(password)

    try {
      await user.save()
      return await this.findOne(user.id)
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email already exists')
      } else {
        throw error
      }
    }
  }

  async validateCredentials(loginInput: LoginInput): Promise<PayloadUser> {
    const { email, password } = loginInput
    const user = await this.findOne({ email })

    if (user && (await user.validatePassword(password))) {
      const payloadUser: PayloadUser = {
        userId: user.id,
        email: user.email,
        username: user.name,
      }
      return payloadUser
    }

    return undefined
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12)
  }
}
