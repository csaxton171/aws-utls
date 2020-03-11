import { EC2, RDS, Lambda } from "aws-sdk";
import { Visitor } from "../../visitor";
import { prop, curry } from "rambdax";
import {
  GenericTaggedResource,
  GenericTag,
  TaggableResource,
  toEc2Arn,
  noArn
} from "../../common";
import { TagCollectionItem } from "./TagCollectionItem";
export class TagCollectorVisitor implements Visitor {
  private readonly collected: TagCollectionItem[];
  private readonly region: string;
  private readonly accountId: string;

  constructor(region: string, accountId: string | undefined) {
    this.region = region;
    this.collected = new Array<TagCollectionItem>();
    this.accountId = accountId || "";
  }

  get result() {
    return [...this.collected];
  }

  visitVpc(vpc: EC2.Vpc) {
    vpc?.VpcId &&
      this.collected.push(
        toTagCollectionItem(
          "Vpc",
          prop("VpcId"),
          toEc2Arn(this.region, this.accountId, "vpc", prop("VpcId")),
          vpc
        )
      );
    return Promise.resolve();
  }
  visitInstances(subjects: EC2.Instance[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("Instance")(prop("InstanceId"))(
          toEc2Arn(this.region, this.accountId, "instance", prop("InstanceId"))
        )
      )
    );
    return Promise.resolve();
  }
  visitVolumes(subjects: EC2.Volume[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("Volume")(prop("VolumeId"))(
          toEc2Arn(this.region, this.accountId, "volume", prop("VolumeId"))
        )
      )
    );
    return Promise.resolve();
  }
  visitSnapshots(subjects: EC2.Snapshot[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("Snapshot")(prop("SnapshotId"))(
          toEc2Arn(this.region, this.accountId, "snapshot", prop("SnapshotId"))
        )
      )
    );
    return Promise.resolve();
  }
  visitNetworkInterfaces(subjects: EC2.NetworkInterface[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("NetworkInterface")(prop("NetworkInterfaceId"))(
          toEc2Arn(
            this.region,
            this.accountId,
            "network-interface",
            prop("NetworkInterfaceId")
          )
        )
      )
    );
    return Promise.resolve();
  }
  visitAddresses(subjects: EC2.Address[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("Address")(prop("AssociationId"))(noArn)
      )
    );
    return Promise.resolve();
  }
  visitSubnets(subjects: EC2.Subnet[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("Subnet")(prop("SubnetId"))(prop("SubnetArn"))
      )
    );
    return Promise.resolve();
  }
  visitRouteTables(subjects: EC2.RouteTable[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("RouteTable")(prop("RouteTableId"))(
          toEc2Arn(
            this.region,
            this.accountId,
            "route-table",
            prop("RouteTableId")
          )
        )
      )
    );
    return Promise.resolve();
  }
  visitInternetGateways(subjects: EC2.InternetGateway[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("InternetGateway")(prop("InternetGatewayId"))(
          toEc2Arn(
            this.region,
            this.accountId,
            "internet-gateway",
            prop("InternetGatewayId")
          )
        )
      )
    );
    return Promise.resolve();
  }
  visitEgressOnlyInternetGateways(subjects: EC2.EgressOnlyInternetGateway[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("EgressOnlyInternetGateway")(
          prop("EgressOnlyInternetGatewayId")
        )(noArn)
      )
    );
    return Promise.resolve();
  }
  visitVpcEndpoints(subjects: EC2.VpcEndpoint[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("VpcEndpoint")(prop("VpcEndpointId"))(
          toEc2Arn(
            this.region,
            this.accountId,
            "vpc-endpoint",
            prop("VpcEndpointId")
          )
        )
      )
    );
    return Promise.resolve();
  }
  visitNatGateways(subjects: EC2.NatGateway[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("NatGateway")(prop("NatGatewayId"))(noArn)
      )
    );
    return Promise.resolve();
  }
  visitVpcPeeringConnections(subjects: EC2.VpcPeeringConnection[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("VpcPeeringConnection")(
          prop("VpcPeeringConnectionId")
        )(
          toEc2Arn(
            this.region,
            this.accountId,
            "vpc-peering-connection",
            prop("VpcPeeringConnectionId")
          )
        )
      )
    );
    return Promise.resolve();
  }
  visitNetworkAcls(subjects: EC2.NetworkAcl[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("NetworkAcl")(prop("NetworkAclId"))(
          toEc2Arn(
            this.region,
            this.accountId,
            "network-acl",
            prop("NetworkAclId")
          )
        )
      )
    );
    return Promise.resolve();
  }
  visitSecurityGroups(subjects: EC2.SecurityGroup[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("SecurityGroup")(prop("GroupId"))(
          toEc2Arn(
            this.region,
            this.accountId,
            "security-group",
            prop("GroupId")
          )
        )
      )
    );
    return Promise.resolve();
  }
  visitRdsDBInstances(subjects: (RDS.DBInstance & GenericTaggedResource)[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("RdsDBInstance")(prop("DBInstanceIdentifier"))(
          prop("DBInstanceArn")
        )
      )
    );
    return Promise.resolve();
  }
  visitRdsDBClusters(subjects: (RDS.DBCluster & GenericTaggedResource)[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("RdsDBCluster")(prop("DBClusterIdentifier"))(
          prop("DBClusterArn")
        )
      )
    );
    return Promise.resolve();
  }
  visitLambdaFunctions(
    subjects: (Lambda.FunctionConfiguration & GenericTaggedResource)[]
  ) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("LambdaFunction")(prop("FunctionName"))(
          prop("FunctionArn")
        )
      )
    );
    return Promise.resolve();
  }
}

export const toTagCollectionItem = curry(
  <
    T extends {
      tags?: GenericTag[];
      Tags?: EC2.TagList | RDS.TagList;
      TagSet?: EC2.TagList;
    }
  >(
    type: TaggableResource,
    getResourceId: (args?: any) => string,
    getResourceArn: (args?: any) => string | undefined,
    subject: T
  ): TagCollectionItem => {
    const tags = [
      ...(subject.tags || subject.Tags || subject.TagSet || [])
    ] as GenericTag[];
    return {
      resourceId: getResourceId(subject),
      resourceArn: getResourceArn(subject),
      type,
      tags
    };
  }
);
