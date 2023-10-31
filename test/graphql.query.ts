export const QUERY1 = `
{
  test1: users {
    id
    tasks {
      id
      title
      type_id
      priority
      story_points
    }
  }
}
`;

export const QUERY2 = `
{
  test2: tasks {
    id
    assignee_id
    descriptions {
      id
      task_id
      descriptionable {
        __typename
        ...on DescriptionTextObjectType {
          ...DescriptionableTextFields
        }
        ...on DescriptionChecklistObjectType {
          id
          title
          items {
            id
            label
            is_checked
          }
        }
      }
    }
  }
}

fragment DescriptionableTextFields on DescriptionTextObjectType {
	id
  text
}
`;

export const QUERY3 = `
{
  test3: users {
    searchTasks {
      __typename
      ...on StoryModel {
        id
        title
        __typename
      }
      ...on TaskObjectType {
        id
        title
        __typename
      }
    }
  }
}
`;

export const QUERY4 = `
{
  test4: users {
    id
    searchTasks {
      ...on TaskObjectType {
        id
      }
    }
  }
}
`;

export const QUERY5 = `
{
  test5: tasks {
    id
    assignee_id
    assignee {
      id
    }
  }
}

`;
