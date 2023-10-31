// import { Filter } from '@nestjs-query/core';
import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DescriptionChecklistObjectType } from '../description/description-types/description-checklist/description-checklist.dto';
import { DescriptionTextObjectType } from '../description/description-types/description-text/description-text.dto';
import {
  DescriptionObjectType,
  DescriptionType,
} from '../description/description.dto';
import { Description } from '../description/description.entity';
import { UserObjectType } from '../user/user.dto';
import { User } from '../user/user.entity';
import { TaskObjectType } from './task.dto';
import { Task } from './task.entity';
import {
  GraphqlLoader,
  Loader,
  LoaderData,
  SelectedFields,
  SelectedFieldsResult,
  SelectedUnionTypes,
  SelectedUnionTypesResult,
} from '../../../loader-lib';

@Resolver(() => TaskObjectType)
export class TaskResolver {
  constructor(
    @InjectRepository(Task) public readonly taskRepository: Repository<Task>,
    @InjectRepository(User) public readonly userRepository: Repository<User>,
    @InjectRepository(Description)
    public readonly descriptionRepository: Repository<Description>,
  ) {}

  @Query(() => [TaskObjectType])
  async tasks(
    @SelectedFields({ sqlAlias: 't' }) selectedFields: SelectedFieldsResult,
  ) {
    const qb = this.taskRepository
      .createQueryBuilder('t')
      .select(selectedFields.fieldsData.fieldsString);

    return qb.getMany();
  }

  @ResolveField(() => UserObjectType, { nullable: true })
  @GraphqlLoader({
    foreignKey: 'assignee_id',
  })
  async assignee(@Loader() loader: LoaderData<TaskObjectType, number>) {
    const qb = this.userRepository.createQueryBuilder('u').andWhere({
      id: In(loader.ids),
    });

    const users = await qb.getMany();

    return loader.helpers.mapManyToOneRelation(users, loader.ids);
  }

  @ResolveField(() => [DescriptionObjectType])
  @GraphqlLoader()
  async descriptions(
    @Loader() loader: LoaderData<TaskObjectType, number>,
    @SelectedUnionTypes({
      nestedPolymorphicResolverName: 'descriptionable',
    })
    selectedUnions: SelectedUnionTypesResult,
  ) {
    const selectedTypes = Array.from(selectedUnions.types.keys()).map(
      (type) => {
        switch (type) {
          case DescriptionTextObjectType.name:
            return DescriptionType.Text;
          case DescriptionChecklistObjectType.name:
            return DescriptionType.Checklist;
        }
      },
    );

    const qb = this.descriptionRepository.createQueryBuilder('d').andWhere({
      task_id: In(loader.ids),
      description_type: In(selectedTypes),
    });

    const descriptions = await qb.getMany();
    return loader.helpers.mapOneToManyRelation(
      descriptions,
      loader.ids,
      'task_id',
    );
  }
}
