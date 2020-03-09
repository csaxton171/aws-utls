import { GenericTaggedResource } from "../../common";

export type TaggableResource =
  | "Address"
  | "EgressOnlyInternetGateway"
  | "Instance"
  | "InternetGateway"
  | "NatGateway"
  | "NetworkAcl"
  | "NetworkInterface"
  | "RdsDBCluster"
  | "RdsDBInstance"
  | "RouteTable"
  | "SecurityGroup"
  | "Snapshot"
  | "Subnet"
  | "Volume"
  | "Vpc"
  | "VpcEndpoint"
  | "VpcPeeringConnection";

export type TagCollectionItem = {
  type: TaggableResource;
  resourceId: string;
  resourceArn?: string;
} & GenericTaggedResource;
