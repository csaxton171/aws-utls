import yargs from "yargs";
import { EC2 } from "aws-sdk";
import { Visitor, visitByVpc } from "../visitor";
import { prop, curry } from "rambdax";

type CrawlConfig = {
  vpcId: string;
  region: string;
};

export const describe = "tags selected vpc and all associated components";

export const builder = () =>
  yargs.options({
    "vpc-id": {
      describe: "vpc id to start the crawl with",
      type: "string"
    },
    region: {
      describe: "aws region",
      type: "string",
      default: "eu-west-1"
    }
  });

export const handler = async (argv: CrawlConfig) => {
  console.log(JSON.stringify(argv, null, 2));
  // const result = await visitByVpc(argv.vpcId, new ConsoleDumpVisitor());

  const visitor = new TagCollectorVisitor();
  const result = await visitByVpc(argv.vpcId, visitor);

  console.log(result);
  dump(visitor.result);
};

class ConsoleDumpVisitor implements Visitor {
  // visitVpc(vpc: EC2.Vpc) {
  //   dump(vpc);
  //   return Promise.resolve();
  // }
  visitInstances(subjects: EC2.Instance[]) {
    dump(subjects);
    return Promise.resolve();
  }
  // visitVolumes(subjects: EC2.Volume[]) {
  //   dump(subjects);
  //   return Promise.resolve();
  // }
  // visitSnapshots(subjects: EC2.Snapshot[]) {
  //   dump(subjects);
  //   return Promise.resolve();
  // }
  // visitNetworkInterfaces(subjects: EC2.NetworkInterface[]) {
  //   dump(subjects);
  //   return Promise.resolve();
  // }
  // visitAddresses(subjects: EC2.Address[]) {
  //   dump(subjects);
  //   return Promise.resolve();
  // }
}

const dump = (value: object) => console.log(JSON.stringify(value, null, 2));

type TaggableResource =
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

type TagCollectionItem = {
  type: TaggableResource;
  resourceId: string;
  tags: EC2.TagList;
};

const toTagCollectionItem = curry(
  <T extends { Tags?: EC2.TagList; TagSet?: EC2.TagList }>(
    type: TaggableResource,
    getResourceId: (args?: any) => string,
    subject: T
  ): TagCollectionItem => {
    const tags = [...(subject.Tags || subject.TagSet || [])];
    return {
      resourceId: getResourceId(subject),
      type,
      tags
    };
  }
);

class TagCollectorVisitor {
  private readonly collected: TagCollectionItem[];

  constructor() {
    this.collected = new Array<TagCollectionItem>();
  }

  get result() {
    return [...this.collected];
  }

  // visitVpc(vpc: EC2.Vpc) {
  //   vpc?.VpcId &&
  //     this.collected.push(toTagCollectionItem("Vpc", prop("VpcId"), vpc));
  //   return Promise.resolve();
  // }
  // visitInstances(subjects: EC2.Instance[]) {
  //   this.collected.push(
  //     ...subjects.map(toTagCollectionItem("Instance")(prop("InstanceId")))
  //   );
  //   return Promise.resolve();
  // }
  // visitVolumes(subjects: EC2.Volume[]) {
  //   this.collected.push(
  //     ...subjects.map(toTagCollectionItem("Volume")(prop("VolumeId")))
  //   );
  //   return Promise.resolve();
  // }
  // visitSnapshots(subjects: EC2.Snapshot[]) {
  //   this.collected.push(
  //     ...subjects.map(toTagCollectionItem("Snapshot")(prop("SnapshotId")))
  //   );
  //   return Promise.resolve();
  // }
  // visitNetworkInterfaces(subjects: EC2.NetworkInterface[]) {
  //   this.collected.push(
  //     ...subjects.map(
  //       toTagCollectionItem("NetworkInterface")(prop("NetworkInterfaceId"))
  //     )
  //   );
  //   return Promise.resolve();
  // }
  // visitAddresses(subjects: EC2.Address[]) {
  //   this.collected.push(
  //     ...subjects.map(toTagCollectionItem("Address")(prop("AssociationId")))
  //   );
  //   return Promise.resolve();
  // }

  visitSubnets(subjects: EC2.Subnet[]) {
    this.collected.push(
      ...subjects.map(toTagCollectionItem("Subnet")(prop("SubnetId")))
    );
    return Promise.resolve();
  }
  visitRouteTables(subjects: EC2.RouteTable[]) {
    this.collected.push(
      ...subjects.map(toTagCollectionItem("RouteTable")(prop("RouteTableId")))
    );
    return Promise.resolve();
  }
  visitInternetGateways(subjects: EC2.InternetGateway[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("InternetGateway")(prop("InternetGatewayId"))
      )
    );
    return Promise.resolve();
  }
  visitEgressOnlyInternetGateways(subjects: EC2.EgressOnlyInternetGateway[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("EgressOnlyInternetGateway")(
          prop("EgressOnlyInternetGatewayId")
        )
      )
    );
    return Promise.resolve();
  }
  visitVpcEndpoints(subjects: EC2.VpcEndpoint[]) {
    this.collected.push(
      ...subjects.map(toTagCollectionItem("VpcEndpoint")(prop("VpcEndpointId")))
    );
    return Promise.resolve();
  }
  visitNatGateways(subjects: EC2.NatGateway[]) {
    this.collected.push(
      ...subjects.map(toTagCollectionItem("NatGateway")(prop("NatGatewayId")))
    );
    return Promise.resolve();
  }
  visitVpcPeeringConnections(subjects: EC2.VpcPeeringConnection[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("VpcPeeringConnection")(
          prop("VpcPeeringConnectionId")
        )
      )
    );
    return Promise.resolve();
  }
  visitNetworkAcls(subjects: EC2.NetworkAcl[]) {
    this.collected.push(
      ...subjects.map(toTagCollectionItem("NetworkAcl")(prop("NetworkAclId")))
    );
    return Promise.resolve();
  }
  visitSecurityGroups(subjects: EC2.SecurityGroup[]) {
    this.collected.push(
      ...subjects.map(
        toTagCollectionItem("SecurityGroup")(prop("SecurityGroupId"))
      )
    );
    return Promise.resolve();
  }
}
