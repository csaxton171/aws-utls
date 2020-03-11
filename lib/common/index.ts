import { EC2, RDS } from "aws-sdk";
import { partial, partition, propEq } from "rambdax";
import { TaggableLambdaResource } from "./lambda";
import { TaggableRdsResource } from "./rds";
import { TaggableEc2Resource } from "./ec2";
import { TaggableElastiCacheResource } from "./elasticache";

export { noArn, toArn, toEc2Arn } from "./arn";
export {
  getElasticCacheClusters,
  getElasticCacheSubnetGroups,
  toElastiCacheArn
} from "./elasticache";
export { withLambdaTags, getLambdaFunctions } from "./lambda";
export {
  getRdsDBClusters,
  getRdsDBInstances,
  withRdsTags,
  filterByRdsClusterId
} from "./rds";

export {
  getAddresses,
  getEgressOnlyInternetGateways,
  getInstances,
  getInternetGateways,
  getNatGateways,
  getNetworkAcls,
  getNetworkInterfaces,
  getRouteTables,
  getSecurityGroups,
  getSnapshots,
  getSubnets,
  getVolumes,
  getVpcEndpoints,
  getVpcPeeringConnections,
  getVpcs
} from "./ec2";

export type EntityResource = {
  resourceId: string;
  resourceArn?: string;
};

export type GenericFilter = { Name: string; Values: string[] };
export type GenericTag = { Key: string; Value: string };
export type GenericTaggedResource = { tags: GenericTag[] };
export type TaggableResource =
  | TaggableEc2Resource
  | TaggableRdsResource
  | TaggableLambdaResource
  | TaggableElastiCacheResource;

export const filterBy = (byField: string, values: string[]) => [
  { Name: byField, Values: values }
];
export const filterByVpc = partial(filterBy, "vpc-id");
export const filterBySnapshotId = partial(filterBy, "snapshot-id");
export const filterByVolumeId = partial(filterBy, "volume-id");
export const filterByInstanceId = partial(filterBy, "instance-id");
export const filterByStatus = partial(filterBy, "status");
export const filterByElastiCacheSubnetGroupName = partial(
  filterBy,
  "subnet-group-name"
);

export const applyPostFilters = async <
  FL extends EC2.FilterList | RDS.FilterList,
  T extends object
>(
  queryFn: (filters: FL | undefined) => Promise<T[]>,
  filters: FL,
  postHandler: [string, (postFilterValues: string[], c: T) => boolean]
): Promise<T[]> => {
  const [postFilterName, postFilterPredicate] = postHandler;
  const [[postFilter = { Values: [] }], preFilters] = partition(
    propEq("Name", postFilterName),
    filters
  );

  const results = await queryFn(preFilters as FL);

  return results.filter(partial(postFilterPredicate, postFilter?.Values));
};

export const parseTagArguments = (values: string[]) =>
  values.map(kvp => {
    const [key, value] = kvp.split("=");
    return { Key: cleanTagElement(key), Value: cleanTagElement(value) };
  });

export const cleanTagElement = (value: string) =>
  `${value}`.replace(/^['"\s]*|['\s"]*$/, "");
