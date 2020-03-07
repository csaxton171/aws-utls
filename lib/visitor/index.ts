import { EC2 } from "aws-sdk";

type vistSubjectFn<T> = (subject: T) => Promise<void>;

export interface Visitor {
  visitVpc?: vistSubjectFn<EC2.Vpc>;
  visitSubnets?: vistSubjectFn<EC2.Subnet[]>;
  visitRouteTables?: vistSubjectFn<EC2.RouteTable[]>;
  visitInternetGateways?: vistSubjectFn<EC2.InternetGateway[]>;
  visitEgressOnlyInternetGateways?: vistSubjectFn<
    EC2.EgressOnlyInternetGateway[]
  >;
  visitVpcEndpoints?: vistSubjectFn<EC2.VpcEndpoint[]>;
  visitNatGateways?: vistSubjectFn<EC2.NatGateway[]>;
  visitVpcPeeringConnections?: vistSubjectFn<EC2.VpcPeeringConnection[]>;
  visitNetworkAcls?: vistSubjectFn<EC2.NetworkAcl[]>;
  visitSecurityGroups?: vistSubjectFn<EC2.SecurityGroup[]>;
  visitInstances?: vistSubjectFn<EC2.Instance[]>;
  visitVolumes?: vistSubjectFn<EC2.Volume[]>;
  visitSnapshots?: vistSubjectFn<EC2.Snapshot[]>;
  visitNetworkInterfaces?: vistSubjectFn<EC2.NetworkInterface[]>;
  visitAddresses?: vistSubjectFn<EC2.Address[]>;
}

export type VisitResult = {
  duration: number;
  error?: Error;
};

export { visitByVpc } from "./byVpc";
