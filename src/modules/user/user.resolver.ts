import { PayloadUser } from 'src/utils/types/payload-user.interface'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { LoginInput } from './types/login-input.type'
import { AuthToken } from './types/token.type'
import { UserInput } from './types/user-input.type'
import { User } from './user.entity'
import { UserService } from './user.service'

@Resolver()
export class UserResolver {
  constructor(private userService: UserService) {}
  @Authorized()
  @Query(() => User, {
    description: 'Returns a user',
  })
  async me(@Ctx('payloadUser') payloadUser: PayloadUser): Promise<User> {
    console.log({ payloadUser })
    return await this.userService.getUser(payloadUser.userId)
  }

  @Mutation((returns) => User, {
    description: 'New user creation, returns the newly created user object',
  })
  async signUp(@Arg('userInput') userInput: UserInput): Promise<User> {
    return await this.userService.signUp(userInput)
  }

  @Mutation((returns) => AuthToken, {
    description: 'User login, returns JWT auth token',
  })
  async login(@Arg('loginInput') loginInput: LoginInput): Promise<AuthToken> {
    return await this.userService.login(loginInput)
  }
}
