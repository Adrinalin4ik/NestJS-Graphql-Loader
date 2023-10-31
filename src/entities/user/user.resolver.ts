import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  GraphqlLoader,
  Loader,
  LoaderData,
  SelectedFields,
  SelectedFieldsResult,
  SelectedUnionTypes,
} from '../../../loader-lib';
import { StoryModel } from '../story/story.entity';
import { TaskObjectType } from '../task/task.dto';
import { Task } from '../task/task.entity';
import {
  SearchTasksUnion,
  UserAggregationType,
  UserObjectType,
} from './user.dto';
import { User } from './user.entity';

@Resolver(() => UserObjectType)
export class UserResolver {
  constructor(
    @InjectRepository(Task) public readonly taskRepository: Repository<Task>,
    @InjectRepository(StoryModel)
    public readonly storyRepository: Repository<StoryModel>,
    @InjectRepository(User) public readonly userRepository: Repository<User>,
  ) {}

  @Query(() => [UserObjectType])
  async users() {
    const qb = this.userRepository
      .createQueryBuilder('u')
      .leftJoin('task', 't', 't.assignee_id = u.id')
      .distinct();

    return qb.getMany();
  }

  @ResolveField(() => [TaskObjectType], { nullable: true })
  @GraphqlLoader()
  async tasks(@Loader() loader: LoaderData<TaskObjectType, number>) {
    const qb = this.taskRepository
      .createQueryBuilder('t')
      .leftJoin('user', 'u', 'u.id = t.assignee_id')
      .andWhere({
        assignee_id: In<number>(loader.ids),
      })
      .distinct();

    const tasks = await qb.getMany();

    return loader.helpers.mapOneToManyRelation(
      tasks,
      loader.ids,
      'assignee_id',
    );
  }

  @ResolveField(() => [SearchTasksUnion])
  @GraphqlLoader({
    foreignKey: (parent: User) => parent.id,
  })
  async searchTasks(
    @Loader() loader: LoaderData<TaskObjectType, number>,
    @SelectedUnionTypes() types,
  ) {
    const results = [];
    if (types.has('StoryModel')) {
      const sqb = await this.storyRepository
        .createQueryBuilder('s')
        .where({
          assignee_id: In(loader.ids),
        })
        .getMany();

      results.push(...sqb);
    }

    if (types.has('TaskObjectType')) {
      const tqb = await this.taskRepository
        .createQueryBuilder('t')
        .where({
          assignee_id: In(loader.ids),
        })
        .getMany();

      results.push(...tqb);
    }
    return loader.helpers.mapOneToManyRelation(
      results,
      loader.ids,
      'assignee_id',
    );
  }

  @Query(() => UserAggregationType)
  async userAggregate(@SelectedFields() fields: SelectedFieldsResult) {
    const qb = this.userRepository.createQueryBuilder('u').select([]);

    for (const field of fields.fieldsData.fieldsString) {
      switch (field) {
        case 'identification_avg':
          qb.addSelect('avg(u.identification_number) as identification_avg');
          break;
        case 'count':
          qb.addSelect('count(u.id) as count');
          break;
      }
    }

    return qb.getRawOne();
  }
}
