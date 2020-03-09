import { TagCollectionItem } from "./TagCollectionItem";
import { difference, pick } from "rambdax";
import { TagSpecification } from "./index";

export const plan = (
  tagSpec: TagSpecification,
  taggedResources: TagCollectionItem[]
) => {
  const desiredTags = tagSpec.tags.map(t => ({
    Key: t.key,
    Value: t.value
  }));

  return taggedResources.map(subject => ({
    ...pick(["resourceId", "resourceArn", "type"], subject),
    changes: difference(desiredTags, subject.tags).map(entry => ({
      ...entry,
      action: "apply"
    }))
  }));
};
