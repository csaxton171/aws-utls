import { EC2, RDS } from "aws-sdk";
import { partial, partition, propEq } from "rambdax";
import { lensProp, set, prop } from "rambda";
import { TaggableLambdaResource } from "./lambda";
import { TaggableRdsResource } from "./rds";
import { TaggableEc2Resource } from "./ec2";
import { TaggableElbResource } from "./elb";
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

export {
  getElbClassicLoadBalancers,
  withElbClassicLoadBalancerTags
} from "./elb";

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
  | TaggableElastiCacheResource
  | TaggableElbResource;

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

type AwsPagedFunc = <R extends object>(
  options: object
) => {
  promise: () => Promise<R>;
};

type NextTokenSpec = {
  /**
   * property name of the paginatedFunc's response that holds the next page token
   */
  getToken: string;
  /**
   * [ use if different from 'getToken' ] property name of the paginatedFunc's options object that contains the next page token
   */
  setToken?: string;
};

/**
 * automatically pages an AWS function to retrieve all results
 * @param paginatedFunc native aws function used to retrieve component info - assumed to support paging
 * @param paginatedFuncOptions native aws function 'options' argument
 * @param nextTokenSpec specifies which properties contain the 'next page' token and which property to set the 'next page' token during request
 * @param getPageItems function used to retrieve the paged items from the aws function response object
 * @param items used during recursive invocation - contains current results
 */
export const withAllPages = async <F extends AwsPagedFunc, R extends object>(
  paginatedFunc: F,
  paginatedFuncOptions: object,
  nextTokenSpec: NextTokenSpec,
  getPageItems: (page: ReturnType<F>) => R[],
  items?: readonly R[]
): Promise<R[]> => {
  const page = await paginatedFunc<ReturnType<F>>(
    paginatedFuncOptions
  ).promise();
  const nextToken = prop(nextTokenSpec.getToken)(page);
  const results = [...(items || []), ...getPageItems(page)];

  if (!nextToken) {
    return results;
  } else {
    return await withAllPages(
      paginatedFunc,
      set(
        lensProp(nextTokenSpec.setToken || nextTokenSpec.getToken),
        nextToken,
        paginatedFuncOptions
      ),
      nextTokenSpec,
      getPageItems,
      results
    );
  }
};

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
