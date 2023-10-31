<p align="center">
  <a href="https://www.npmjs.com/package/nestjs-graphql-loader" target="blank"><img src="https://raw.githubusercontent.com/Adrinalin4ik/Nestjs-Graphql-Loader/master/images/svg.svg" width="200" alt="NestJS Graphql loader Logo" /></a>
</p>
<h1 align="center">NestJS Graphql Loader</h1>
<p align="center"><a href="http://nestjs.com/" target="_blank">NestJS</a> Graphql automation library for building performant API</p>
<p align="center">
  <a href="https://www.npmjs.com/package/nestjs-graphql-loader" target="_blank"><img src="https://img.shields.io/npm/v/nestjs-graphql-loader.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/nestjs-graphql-loader" target="_blank"><img src="https://img.shields.io/npm/l/nestjs-graphql-loader.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/nestjs-graphql-loader" target="_blank"><img src="https://img.shields.io/npm/dm/nestjs-graphql-loader.svg" alt="NPM Downloads" /></a>
</p>


## Description

The library allows to build efficient graphql API helping overcome n+1 problem with the minimum dependencies. It provides a bunch of decorators that make life easier.

## Extentions
- [NestJS-Graphql-Tools](https://www.npmjs.com/package/nestjs-graphql-tools) - the library that enchance experience in building Garphql API 

## Overview
- [Description](#description)
- [Extentions](#extentions)
- [Overview](#overview)
- [Installation](#installation)
- [Loader usage guide](#loader-usage-guide)
  - [One to many example](#one-to-many-example)
  - [Many to one relation](#many-to-one-relation)
- [Polymorphic relations](#polymorphic-relations)
  - [Usage](#usage)
    - [Example](#example)
- [Field extraction](#field-extraction)
  - [Basic example](#basic-example)
- [Federation](#federation)
  - [Example](#example-1)
- [More examples](#more-examples)
- [Contribution](#contribution)
- [License](#license)

## Installation

```bash
npm i nestjs-graphql-tools
or
yarn add nestjs-graphql-tools
```

## Loader usage guide
  1. Decorate your resolver with `@GraphqlLoader()`
  2. Add `@Loader()` parameter as a first parameter
  3. @Loader will return you LoaderData interface which includes ids of entities and helpers for constructing sutable object for graphql

### One to many example

```typescript
@Resolver(() => UserObjectType) 
export class UserResolver {

  @ResolveField(() => TaskObjectType)
  @GraphqlLoader() // <-- It's important to add decorator here
  async tasks(
    @Loader() loader: LoaderData<TaskObjectType, number>, // <-- and here
    @Args('story_points') story_points: number, // custom search arg
  ) {
    const tasks = await getRepository(Task).find({
      where: {
        assignee_id: In<number>(loader.ids) // assignee_id is foreign key from Task to User table
        story_points
      }
    });

    return loader.helpers.mapOneToManyRelation(tasks, loader.ids, 'assignee_id'); // this helper will construct an object like { <assignee_id>: Task }. Graphql expects this shape.
  }
}
```

### Many to one relation
```typescript
@Resolver(() => TaskObjectType)
export class TaskResolver {

  constructor(
    @InjectRepository(User) public readonly userRepository: Repository<User>
  ) {}

  @ResolveField(() => UserObjectType)
  @GraphqlLoader({
    foreignKey: 'assignee_id' // Here we're providing foreigh key. Decorator gather all the keys from parent and provide it in loader.ids
  })
  async assignee(
    @Loader() loader: LoaderData<TaskObjectType, number>,
  ) {
    const qb = this.userRepository.createQueryBuilder('u')
      .andWhere({
        id: In(loader.ids) // Here will be assigne_ids
      })
    const users = await qb.getMany();

    return loader.helpers.mapManyToOneRelation(users, loader.ids); // This helper provide the shape {assignee_id: User}
  }
}
```
## Polymorphic relations
`@GraphqlLoader` decorator provides ability to preload polymorphic relations
### Usage
To be able to use it you need to decorate your resolver with `@GraphqlLoader` decorator. Decorator has parameter which allows to specify fields which needs to be gathered for polymorphic relation.

```typescript
@GraphqlLoader({
  polymorphic: {
    idField: 'description_id', // Name of polymorphic id attribute of the parent model
    typeField: 'description_type' // Name of polymorphic type attribute of the parent model
  }
})
```
This decorator will aggregate all types and provide ids for each type. All aggregated types will be aveilable in `@Loader` decorator. It has attribute which called `polymorphicTypes. 

PolmorphicTypes attribute shape 
```typescript
[
  {
    type: string | number
    ids: string[] | number[]
  }
]

```

#### Example

```typescript
// Parent class
// task.resolver.ts
@Resolver(() => TaskObjectType)
export class TaskResolver {
  constructor(
    @InjectRepository(Task) public readonly taskRepository: Repository<Task>,
    @InjectRepository(Description) public readonly descriptionRepository: Repository<Description>
  ) {}

  @ResolveField(() => [DescriptionObjectType])
  @GraphqlLoader()
  async descriptions(
    @Loader() loader: LoaderData<TaskObjectType, number>,
    @SelectedUnionTypes({ 
      nestedPolymorphicResolverName: 'descriptionable',
    }) selectedUnions: SelectedUnionTypesResult // <-- This decorator will gather and provide selected union types. NestedPolymorphicResolverName argument allows to specify where specifically it should gather the fields
  ) {
    // Mapping graphql types to the database types
    const selectedTypes = Array.from(selectedUnions.types.keys()).map(type => { 
      switch (type) {
        case DescriptionTextObjectType.name:
          return DescriptionType.Text;
        case DescriptionChecklistObjectType.name:
          return DescriptionType.Checklist;
      }
    });

    const qb = this.descriptionRepository.createQueryBuilder('d')
      .andWhere({
        task_id: In(loader.ids),
        description_type: In(selectedTypes) // finding only selected types
      })
    
    const descriptions = await qb.getMany();
    return loader.helpers.mapOneToManyRelation(descriptions, loader.ids, 'task_id');
  }
}


// Polymorphic resolver
// description.resolver.ts
@Resolver(() => DescriptionObjectType)
export class DescriptionResolver {
  constructor(
    @InjectRepository(DescriptionText) public readonly descriptionTextRepository: Repository<DescriptionText>,
    @InjectRepository(DescriptionChecklist) public readonly descriptionChecklistRepository: Repository<DescriptionChecklist>,
  ) {}
  
  @ResolveField(() => [DescriptionableUnion], { nullable: true })
  @GraphqlLoader({ // <-- We will load description_id field of parent model to the ids and description_type field to the type
    polymorphic: {
      idField: 'description_id',
      typeField: 'description_type'
    }
  })
  async descriptionable(
    @Loader() loader: PolymorphicLoaderData<[DescriptionText | DescriptionChecklist], number, DescriptionType>, // <-- It will return aggregated polymorphicTypes
    @SelectedUnionTypes() types: SelectedUnionTypesResult // <-- It will extract from the query and return selected union types
  ) {
    const results = []; // <-- We need to gather all entities to the single array

    for (const item of loader.polimorphicTypes) {
      switch(item.descriminator) {
        case DescriptionType.Text:
          const textDescriptions = await this.descriptionTextRepository.createQueryBuilder()
          .select(types.getFields(DescriptionTextObjectType))
          .where({
            id: In(item.ids)
          })
          .getRawMany();

          results.push({ descriminator: DescriptionType.Text, entities: textDescriptions })

          break;
        case DescriptionType.Checklist:
          const checklistDescriptions = await this.descriptionChecklistRepository.createQueryBuilder()
          .select(types.getFields(DescriptionChecklistObjectType))
          .where({
            id: In(item.ids)
          })
          .getRawMany();

          results.push({ descriminator: DescriptionType.Checklist, entities: checklistDescriptions })
          
          break;
        default: break;
      }
    }
    return loader.helpers.mapOneToManyPolymorphicRelation(results, loader.ids); // <-- This helper will change shape of responce to the shape which is sutable for graphql
  }
}
```
You can find complete example in src/descriptions folder


## Field extraction
The library allows to gather only requested field from the query and provides it as an array to the parameter variable.

### Basic example

Simple graphql query
```graphql
{
  tasks {
    id
    title
  }
}

```
Resolver

```typescript
@Resolver(() => TaskObjectType)
export class TaskResolver {
  constructor(@InjectRepository(Task) public readonly taskRepository: Repository<Task>) {}

  @Query(() => [TaskObjectType])
  async tasks(
   @SelectedFields({sqlAlias: 't'}) selectedFields: SelectedFieldsResult // Requested fields will be here. sqlAlias is optional thing. It useful in case if you're using alias in query builder
  ) {
    const res = await this.taskRepository.createQueryBuilder('t')
      .select(selectedFields.fieldsData.fieldsString) // fieldsString return array of strings
      .getMany();
    return res;
  }
}
```

The query will generate typeorm request with only requested fields
```sql
SELECT "t"."id" AS "t_id", "t"."title" AS "t_title" FROM "task" "t"
```

## Federation
Basic support of federation already in place. Just add to your method with `@ResolveReference()` one more decorator `@GraphqlLoader()`

### Example
This examples is the reference to official example https://github.com/nestjs/nest/tree/master/sample/31-graphql-federation-code-first. Clone https://github.com/nestjs/nest/tree/master/sample/31-graphql-federation-code-first (download specific directory with https://download-directory.github.io/ or with chrome extention https://chrome.google.com/webstore/detail/gitzip-for-github/ffabmkklhbepgcgfonabamgnfafbdlkn)
1. Annotate method resolveReference of `users-application/src/users/users.resolver.ts`
```typescript
// users-application/src/users/users.resolver.ts
@ResolveReference()
@GraphqlLoader()
async resolveReference(
   @Loader() loader: LoaderData<User, number>,
) {
 const ids = loader.ids;
 const users = this.usersService.findByIds(ids);
 return loader.helpers.mapManyToOneRelation(users, loader.ids, 'id')
}
```
1. Add method findByIds to `users-application/src/users/users.service.ts`
```typescript
// users-application/src/users/users.service.ts
@Injectable()
export class UsersService {
  private users: User[] = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Richard Roe' },
  ];

  findByIds(idsList: number[]): User[] {
    return this.users.filter((user) => idsList.some(id => Number(id) === user.id));
  }
}
```
3. Install dependencies of 3 projects : npm ci in gateway, posts-application, users-application.
4. Run all projects in order :
   - `cd users-application && npm run start`
   - `cd posts-application && npm run start`
   - `cd gateway && npm run start`

5. Go to localhost:3001/graphql and send graphql request to gateway
```graphql
{
  posts {
    id
    title
    authorId
    user {
      id
      name
    }
  }
}
```

## More examples
You can find more examples in the src folder


## Contribution
If you want to contribute please create new PR with good description.

How to run the project:
1. Run dev server
```bash
yarn install
yarn start:dev
```
On the first run, server will seed up the database with testing dataset.

2. Reach out `http://localhost:3000/graphql`

## License

NestJS Graphql tools is [GNU GPLv3 licensed](LICENSE).
