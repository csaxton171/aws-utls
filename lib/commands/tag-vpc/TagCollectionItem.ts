import {
  GenericTaggedResource,
  TaggableResource,
  EntityResource
} from "../../common";

export type TagCollectionItem = {
  type: TaggableResource;
} & EntityResource &
  GenericTaggedResource;
