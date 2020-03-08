import { Visitor, VisitResult, safeVisit } from "./index";
import { EC2, RDS } from "aws-sdk";
import {
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
  getRdsDBClusters,
  getRdsDBInstances,
  getVolumes,
  getVpcEndpoints,
  getVpcPeeringConnections,
  getVpcs,
  filterByVpc,
  filterByInstanceId,
  filterByVolumeId
} from "../common";

export const visitByVpc = async (
  vpcId: string,
  visitor: Visitor,
  region?: string
): Promise<VisitResult[]> => {
  const byVpc = filterByVpc([vpcId]);
  const byVpcAttachment = [{ Name: "attachment.vpc-id", Values: [vpcId] }];
  const ec2 = new EC2({ region: region || "eu-west-1" });
  const rds = new RDS({ region: region || "eu-west-1" });

  const [vpc] = await getVpcs(ec2, byVpc);
  if (!vpc) {
    throw new Error(`unable to locate Vpc '${vpcId}'`);
  }

  const [
    subnets,
    routeTables,
    internetGateways,
    egressOnlyInternetGateways,
    vpcEndpoints,
    natGateways,
    vpcPeeringConnections,
    networkAcls,
    securityGroups,
    instances
  ] = await Promise.all([
    getSubnets(ec2, byVpc),
    getRouteTables(ec2, byVpc),
    getInternetGateways(ec2, byVpcAttachment),
    getEgressOnlyInternetGateways(ec2, byVpcAttachment),
    getVpcEndpoints(ec2, byVpc),
    getNatGateways(ec2, byVpc),
    getVpcPeeringConnections(ec2, [
      { Name: "requester-vpc-info.vpc-id", Values: [vpcId] }
    ]),
    getNetworkAcls(ec2, byVpc),
    getSecurityGroups(ec2, byVpc),
    getInstances(ec2, byVpc)
  ]);

  const [networkInterfaces, addresses] = await Promise.all([
    getNetworkInterfaces(ec2, byVpc),
    getAddresses(ec2, filterByInstanceId(instances.map(i => i.InstanceId!)))
  ]);

  const volumeIds = instances
    .flatMap(i => i.BlockDeviceMappings || [])
    .map(bdm => bdm.Ebs)
    .map(ebs => ebs?.VolumeId || "")
    .filter(v => v);
  const byVolumeIds = filterByVolumeId(volumeIds);

  const [volumes, snapshots] = await Promise.all([
    getVolumes(ec2, byVolumeIds),
    getSnapshots(ec2, byVolumeIds)
  ]);

  return (
    await Promise.all([
      safeVisit(visitor)(vpc, visitor.visitVpc),
      safeVisit(visitor)(subnets, visitor.visitSubnets),
      safeVisit(visitor)(routeTables, visitor.visitRouteTables),
      safeVisit(visitor)(internetGateways, visitor.visitInternetGateways),
      safeVisit(visitor)(
        egressOnlyInternetGateways,
        visitor.visitEgressOnlyInternetGateways
      ),
      safeVisit(visitor)(vpcEndpoints, visitor.visitVpcEndpoints),
      safeVisit(visitor)(natGateways, visitor.visitNatGateways),
      safeVisit(visitor)(
        vpcPeeringConnections,
        visitor.visitVpcPeeringConnections
      ),
      safeVisit(visitor)(networkAcls, visitor.visitNetworkAcls),
      safeVisit(visitor)(securityGroups, visitor.visitSecurityGroups),
      safeVisit(visitor)(instances, visitor.visitInstances),
      safeVisit(visitor)(volumes, visitor.visitVolumes),
      safeVisit(visitor)(snapshots, visitor.visitSnapshots),
      safeVisit(visitor)(networkInterfaces, visitor.visitNetworkInterfaces),
      safeVisit(visitor)(addresses, visitor.visitAddresses)
    ])
  ).filter(res => res.func);
};
