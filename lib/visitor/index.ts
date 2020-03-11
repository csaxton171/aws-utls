import { EC2, RDS, Lambda } from "aws-sdk";
import { performance } from "perf_hooks";
import { GenericTaggedResource } from "../common";

type vistSubjectFn<T> = (subject: T) => Promise<void>;

// TODO split this out
export interface Visitor {
  visitAddresses?: vistSubjectFn<EC2.Address[]>;
  visitEgressOnlyInternetGateways?: vistSubjectFn<
    EC2.EgressOnlyInternetGateway[]
  >;
  visitInstances?: vistSubjectFn<EC2.Instance[]>;
  visitInternetGateways?: vistSubjectFn<EC2.InternetGateway[]>;
  visitNatGateways?: vistSubjectFn<EC2.NatGateway[]>;
  visitNetworkAcls?: vistSubjectFn<EC2.NetworkAcl[]>;
  visitNetworkInterfaces?: vistSubjectFn<EC2.NetworkInterface[]>;
  visitRdsDBClusters?: vistSubjectFn<(RDS.DBCluster & GenericTaggedResource)[]>;
  visitRdsDBInstances?: vistSubjectFn<
    (RDS.DBInstance & GenericTaggedResource)[]
  >;
  visitRouteTables?: vistSubjectFn<EC2.RouteTable[]>;
  visitSecurityGroups?: vistSubjectFn<EC2.SecurityGroup[]>;
  visitSnapshots?: vistSubjectFn<EC2.Snapshot[]>;
  visitSubnets?: vistSubjectFn<EC2.Subnet[]>;
  visitVolumes?: vistSubjectFn<EC2.Volume[]>;
  visitVpc?: vistSubjectFn<EC2.Vpc>;
  visitVpcEndpoints?: vistSubjectFn<EC2.VpcEndpoint[]>;
  visitVpcPeeringConnections?: vistSubjectFn<EC2.VpcPeeringConnection[]>;
  visitLambdaFunctions?: vistSubjectFn<
    (Lambda.FunctionConfiguration & GenericTaggedResource)[]
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
