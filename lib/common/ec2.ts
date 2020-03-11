import { EC2, RDS } from "aws-sdk";
import { partition, partial, propEq } from "rambdax";

export type TaggableEc2Resource =
  | "Address"
  | "EgressOnlyInternetGateway"
  | "Instance"
  | "InternetGateway"
  | "NatGateway"
  | "NetworkAcl"
  | "NetworkInterface"
  | "RouteTable"
  | "SecurityGroup"
  | "Snapshot"
  | "Subnet"
  | "Volume"
  | "Vpc"
  | "VpcEndpoint"
  | "VpcPeeringConnection";

export const getVpcs = async (ec2: EC2, filters: EC2.FilterList) => {
  return (await ec2.describeVpcs({ Filters: filters }).promise()).Vpcs || [];
};

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
