import { Visitor, VisitResult, safeVisit } from "./index";
import { EC2, RDS, Lambda, ElastiCache, ELB } from "aws-sdk";
import {
  getAddresses,
  getEgressOnlyInternetGateways,
  getElbClassicLoadBalancers,
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
  getLambdaFunctions,
  filterByVpc,
  filterByInstanceId,
  filterByVolumeId,
  filterByRdsClusterId,
  filterByElastiCacheSubnetGroupName,
  withElbClassicLoadBalancerTags,
  withRdsTags,
  withLambdaTags,
  getElasticCacheSubnetGroups,
  getElasticCacheClusters
} from "../common";
import { prop } from "rambdax";
import { withElastiCacheTags, toElastiCacheArn } from "../common/elasticache";

type VisitByVpcOptions = {
  accountInfo: { account: string | undefined; region: string };
  vpcId: string;
};
export const visitByVpc = async (
  options: VisitByVpcOptions,
  visitor: Visitor
): Promise<VisitResult[]> => {
  const {
    vpcId,
    accountInfo: { account, region }
  } = options;
  const byVpc = filterByVpc([vpcId]);
  const byVpcAttachment = [{ Name: "attachment.vpc-id", Values: [vpcId] }];
  const ec2 = new EC2({ region: region || "eu-west-1" });
  const rds = new RDS({ region: region || "eu-west-1" });
  const lambda = new Lambda({ region: region || "eu-west-1" });
  const elasticache = new ElastiCache({ region: region || "eu-west-1" });
  const elb = new ELB({ region: region || "eu-west-1" });

  const toElastiCacheClusterArn = toElastiCacheArn(
    region,
    account,
    "cluster",
    prop("CacheClusterId")
  );

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

  const [
    networkInterfaces,
    addresses,
    rdsDbInstances,
    lambdFunctions,
    elastiCacheSubnetGroups,
    elbClassicLoadBalancers
  ] = await Promise.all([
    getNetworkInterfaces(ec2, byVpc),
    getAddresses(ec2, filterByInstanceId(instances.map(i => i.InstanceId!))),
    getRdsDBInstances(rds, byVpc).then(instances =>
      withRdsTags(rds, prop("DBInstanceArn"), instances)
    ),
    getLambdaFunctions(lambda, byVpc).then(functions =>
      withLambdaTags(lambda, prop("FunctionArn"), functions)
    ),
    getElasticCacheSubnetGroups(elasticache, byVpc),
    getElbClassicLoadBalancers(elb, byVpc).then(loadBalancers =>
      withElbClassicLoadBalancerTags(elb, loadBalancers)
    )
  ]);

  const [rdsDBClusters, elastiCacheClusters] = await Promise.all([
    getRdsDBClusters(rds, [
      filterByRdsClusterId(rdsDbInstances)
    ]).then(clusters => withRdsTags(rds, prop("DBClusterArn"), clusters)),
    getElasticCacheClusters(
      elasticache,
      filterByElastiCacheSubnetGroupName(
        elastiCacheSubnetGroups.map(e => e?.CacheSubnetGroupName!)
      )
    ).then(withElastiCacheTags(elasticache, toElastiCacheClusterArn))
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
      safeVisit(visitor)(addresses, visitor.visitAddresses),

      safeVisit(visitor)(rdsDbInstances, visitor.visitRdsDBInstances),
      safeVisit(visitor)(rdsDBClusters, visitor.visitRdsDBClusters),

      safeVisit(visitor)(lambdFunctions, visitor.visitLambdaFunctions),

      safeVisit(visitor)(
        elastiCacheClusters,
        visitor.visitElastiCacheCacheClusters
      ),
      safeVisit(visitor)(
        elbClassicLoadBalancers,
        visitor.visitElbClassicLoadBalancers
      )
    ])
  ).filter(res => res.func);
};
