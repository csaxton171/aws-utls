import { ElastiCache } from "aws-sdk";
import {
  partial,
  compose,
  isNil,
  find,
  propEq,
  ifElse,
  T,
  curry
} from "rambdax";
import { GenericFilter, GenericTag, GenericTaggedResource } from "./index";

export type TaggableElastiCacheResource = "ElastiCacheCluster";

export const getElasticCacheSubnetGroups = async (
  elasticCache: ElastiCache,
  filters: GenericFilter[]
) => {
  const functions =
    (await elasticCache.describeCacheSubnetGroups({}).promise())
      .CacheSubnetGroups || [];

  const vpcFilter = compose(
    (fltr: GenericFilter | undefined) =>
      ifElse(isNil, T, onlyVpcSubnetGroups(fltr!.Values)),
    find(propEq("Name", "vpc-id"))
  )(filters);

  return functions.filter(vpcFilter);
};

export const getElasticCacheClusters = async (
  elasticCache: ElastiCache,
  filters: GenericFilter[]
) => {
  const functions =
    (
      await elasticCache
        .describeCacheClusters({ ShowCacheNodeInfo: false })
        .promise()
    ).CacheClusters || [];

  const subnetGroupNameFilter = compose(
    (fltr: GenericFilter | undefined) =>
      ifElse(isNil, T, onlySubnetGroupClusters(fltr!.Values)),
    find(propEq("Name", "subnet-group-name"))
  )(filters);

  return functions.filter(subnetGroupNameFilter);
};

const onlySubnetGroupClusters = curry(
  (subnetGroupNames: string[], e: ElastiCache.CacheCluster) =>
    subnetGroupNames.includes(e.CacheSubnetGroupName || "")
);

export const onlyVpcSubnetGroups = curry(
  (vpcIds: string[], sg: ElastiCache.CacheSubnetGroup) =>
    vpcIds.includes(sg.VpcId || "")
);

export const withElastiCacheTags = curry(
  <T>(
    elasticCache: ElastiCache,
    getResourceArn: (args?: any) => string,
    resources: T[]
  ) =>
    Promise.all(
      resources.map(async res => {
        const rtags = await elasticCache
          .listTagsForResource({ ResourceName: getResourceArn(res) })
          .promise();
        return { ...res, tags: (rtags.TagList as GenericTag[]) || [] } as T &
          GenericTaggedResource;
      })
    )
);

export const toElastiCacheArn = partial(
  <T>(
    region: string,
    account: string,
    resourceType: string,
    getResourceId: (subject: T) => string
  ) => (subject: T) =>
    `arn:aws:elasticache:${region}:${account}:${resourceType}:${getResourceId(
      subject
    )}`
);
