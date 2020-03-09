import { EC2, RDS } from "aws-sdk";
import { partial, groupBy, partition, propEq } from "rambdax";

export const getVpcs = async (ec2: EC2, filters: EC2.FilterList) => {
  return (await ec2.describeVpcs({ Filters: filters }).promise()).Vpcs || [];
};

const filterBy = (byField: string, values: string[]) => [
  { Name: byField, Values: values }
];
export const filterByVpc = partial(filterBy, "vpc-id");
export const filterBySnapshotId = partial(filterBy, "snapshot-id");
export const filterByVolumeId = partial(filterBy, "volume-id");
export const filterByInstanceId = partial(filterBy, "instance-id");
export const filterByStatus = partial(filterBy, "status");

export const getSubnets = async (ec2: EC2, filters: EC2.FilterList) => {
  return (
    (await ec2.describeSubnets({ Filters: filters }).promise()).Subnets || []
  );
};

export const getRouteTables = async (ec2: EC2, filters: EC2.FilterList) => {
  return (
    (await ec2.describeRouteTables({ Filters: filters }).promise())
      .RouteTables || []
  );
};

export const getInternetGateways = async (
  ec2: EC2,
  filters: EC2.FilterList
) => {
  return (
    (await ec2.describeInternetGateways({ Filters: filters }).promise())
      .InternetGateways || []
  );
};

export const getEgressOnlyInternetGateways = (
  ec2: EC2,
  filters: EC2.FilterList
) => {
  return applyPostFilters(
    async fltrs =>
      (
        await ec2
          .describeEgressOnlyInternetGateways(
            fltrs?.length ? { Filters: fltrs } : {}
          )
          .promise()
      ).EgressOnlyInternetGateways || [],
    filters,
    [
      "attachment.vpc-id",
      (values, gw: EC2.EgressOnlyInternetGateway) =>
        !!gw.Attachments?.find(a => values.includes(a.VpcId || ""))
    ]
  );
};

export const getVpcEndpoints = async (ec2: EC2, filters: EC2.FilterList) => {
  return (
    (await ec2.describeVpcEndpoints({ Filters: filters }).promise())
      .VpcEndpoints || []
  );
};

export const getNatGateways = async (ec2: EC2, filters: EC2.FilterList) => {
  return (
    (await ec2.describeNatGateways({ Filter: filters }).promise())
      .NatGateways || []
  );
};

export const getVpcPeeringConnections = async (
  ec2: EC2,
  filters: EC2.FilterList
) => {
  return (
    (await ec2.describeVpcPeeringConnections({ Filters: filters }).promise())
      .VpcPeeringConnections || []
  );
};

export const getNetworkAcls = async (ec2: EC2, filters: EC2.FilterList) => {
  return (
    (await ec2.describeNetworkAcls({ Filters: filters }).promise())
      .NetworkAcls || []
  );
};

export const getSecurityGroups = async (ec2: EC2, filters: EC2.FilterList) => {
  return (
    (await ec2.describeSecurityGroups({ Filters: filters }).promise())
      .SecurityGroups || []
  );
};

export const getVolumes = async (ec2: EC2, filters: EC2.FilterList) => {
  return (
    (await ec2.describeVolumes({ Filters: filters }).promise()).Volumes || []
  );
};

export const getInstances = async (ec2: EC2, filters: EC2.FilterList) => {
  const reservations =
    (await ec2.describeInstances({ Filters: filters }).promise())
      .Reservations || [];

  return reservations.flatMap(res => res.Instances || []);
};

export const getSnapshots = async (ec2: EC2, filters: EC2.FilterList) => {
  return (
    (await ec2.describeSnapshots({ Filters: filters }).promise()).Snapshots ||
    []
  );
};

export const getNetworkInterfaces = async (
  ec2: EC2,
  filters: EC2.FilterList
) => {
  return (
    (await ec2.describeNetworkInterfaces({ Filters: filters }).promise())
      .NetworkInterfaces || []
  );
};

export const getAddresses = async (ec2: EC2, filters: EC2.FilterList) => {
  return (
    (await ec2.describeAddresses({ Filters: filters }).promise()).Addresses ||
    []
  );
};

export const getRdsDBClusters = async (rds: RDS, filters: RDS.FilterList) => {
  return (
    (await rds.describeDBClusters({ Filters: filters }).promise()).DBClusters ||
    []
  );
};

export const getRdsDBInstances = async (rds: RDS, filters: RDS.FilterList) => {
  return applyPostFilters(
    async filters =>
      (
        await rds
          .describeDBInstances({
            Filters: filters
          })
          .promise()
      ).DBInstances || [],
    filters,
    [
      "vpc-id",
      (values, dbi: RDS.DBInstance) =>
        values.includes(dbi.DBSubnetGroup?.VpcId || "")
    ]
  );
};

const applyPostFilters = async <
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

const cleanTagElement = (value: string) =>
  `${value}`.replace(/^['"\s]*|['\s"]*$/, "");
