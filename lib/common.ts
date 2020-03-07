import { EC2 } from "aws-sdk";
import { partial } from "rambdax";

export const getVpcs = async (ec2: EC2, filters: EC2.FilterList) => {
  return (await ec2.describeVpcs({ Filters: filters }).promise()).Vpcs || [];
};

const filterBy = (byField: string, values: string[]) => [
  { Name: byField, Values: values }
];
export const filterByVpc = partial(filterBy, "vpc-id");
export const filterBySnapshotId = partial(filterBy, "snapshot-id");
export const filterByInstanceId = partial(filterBy, "instance-id");

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

export const getEgressOnlyInternetGateways = async (
  ec2: EC2,
  filters: EC2.FilterList
) => {
  return (
    (
      await ec2
        .describeEgressOnlyInternetGateways({ Filters: filters })
        .promise()
    ).EgressOnlyInternetGateways || []
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

export const parseTagArguments = (values: string[]) =>
  values.map(kvp => {
    const [key, value] = kvp.split("=");
    return { Key: cleanTagElement(key), Value: cleanTagElement(value) };
  });

const cleanTagElement = (value: string) =>
  `${value}`.replace(/^['"\s]*|['\s"]*$/, "");
