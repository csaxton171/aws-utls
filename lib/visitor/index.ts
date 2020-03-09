import { EC2, RDS } from "aws-sdk";
import { performance } from "perf_hooks";
import { GenericTaggedResource } from "../common";

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
  visitRdsDBClusters?: vistSubjectFn<(RDS.DBCluster & GenericTaggedResource)[]>;
  visitRdsDBInstances?: vistSubjectFn<
    (RDS.DBInstance & GenericTaggedResource)[]
  >;
}

export type VisitResult = {
  duration: number;
  error?: Error;
};

export const safeVisit = (visitor: Visitor) => async <T>(
  subject: T,
  fn?: (subject: T) => Promise<void>,
  label?: string
) => {
  const inferLabel = (fn: Function) => {
    const match = /^\s*(?<funcName>[^\(.]+)/.exec(fn.toString());
    return match?.groups?.funcName;
  };
  const result: { func?: string; duration: number; error?: Error } = {
    func: label,
    duration: 0
  };
  const start = performance.now();
  try {
    if (!fn) {
      return result;
    }
    if (!result.func) {
      result.func = inferLabel(fn);
    }

    await fn.call(visitor, subject);
  } catch (err) {
    result.error = err;
  } finally {
    result.duration = performance.now() - start;
    return result;
  }
};

export { visitByVpc } from "./byVpc";
