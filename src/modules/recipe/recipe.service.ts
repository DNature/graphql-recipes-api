import { PayloadUser } from 'src/utils/types/payload-user.interface'
import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { CategoryRepository } from '../category/category.repository'
import { UserRepository } from '../user/user.repository'
import { NameOrIdInput } from '../utils/types/name-or-id-input.type'
import { Recipe } from './recipe.entity'
import { RecipeRepository } from './recipe.repository'
import { CreateRecipeInput } from './types/create-recipe-input.type'
import { FilterInput } from './types/filter-input.type'
import { UpdateRecipeInput } from './types/update-recipe-input.type'
import { UpdateRecipe } from './types/update-recipe.interface'

@Service()
export class RecipeService {
  constructor(
    @InjectRepository(RecipeRepository)
    private recipeRespository: RecipeRepository,
    @InjectRepository(UserRepository)
    private userRespository: UserRepository,
    @InjectRepository(CategoryRepository)
    private categoryRespository: CategoryRepository
  ) {}

  async getRecipes(): Promise<Recipe[]> {
    return await this.recipeRespository.find({
      order: {
        id: 'DESC',
      },
    })
  }

  async getOneRecipe(recipeNameOrId: NameOrIdInput): Promise<Recipe> {
    return await this.recipeRespository.findRecipe(recipeNameOrId)
  }

  async getMyRecipes({ userId }: PayloadUser): Promise<Recipe[]> {
    return await this.recipeRespository.find({
      where: { userId },
      order: {
        id: 'DESC',
      },
    })
  }

  async getFilteredRecipes(filterInput: FilterInput): Promise<Recipe[]> {
    return await this.recipeRespository.getFilteredRecipes(filterInput)
  }

  async createRecipe(
    createRecipeInput: CreateRecipeInput,
    { userId }: PayloadUser
  ): Promise<Recipe> {
    const { categoryNameOrId } = createRecipeInput

    const category = await this.categoryRespository.findCategory(
      categoryNameOrId
    )

    const user = await this.userRespository.findUser(userId)

    return await this.recipeRespository.createRecipe(
      createRecipeInput,
      user,
      category
    )
  }

  async updateRecipe(
    updateRecipeInput: UpdateRecipeInput,
    { userId }: PayloadUser
  ): Promise<Recipe> {
    if (Object.keys(updateRecipeInput).length <= 1) {
      throw new Error('At least one update field must be provided')
    }

    const { targetRecipeNameOrId, categoryNameOrId } = updateRecipeInput

    const recipe = await this.recipeRespository.findRecipe(
      targetRecipeNameOrId,
      userId
    )

    delete updateRecipeInput.targetRecipeNameOrId
    delete updateRecipeInput.categoryNameOrId

    const updateData: UpdateRecipe = { ...updateRecipeInput }

    if (categoryNameOrId) {
      const category = await this.categoryRespository.findCategory(
        categoryNameOrId
      )
      updateData.category = category
    }

    const partialRecipe = this.recipeRespository.create({
      ...updateData,
    })

    this.recipeRespository.merge(recipe, partialRecipe)

    return await recipe.saveCheckingDuplicateName()
  }

  async deleteRecipe(id: number, { userId }: PayloadUser): Promise<boolean> {
    const result = await this.recipeRespository.delete({ id, userId })

    if (result.affected === 0) {
      throw new Error(`Recipe not found`)
    }
    return true
  }
}
