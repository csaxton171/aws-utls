import { EC2 } from "aws-sdk";
import stringify from "csv-stringify";
import {
  composeAsync,
  defaultTo,
  mapAsync,
  take,
  pick,
  propEq,
  filter,
  Dictionary
} from "rambdax";
import { Volume } from "aws-sdk/clients/ec2";
import { writeFile } from "fs";
import yargs from "yargs";
import { Bar, Presets } from "cli-progress";
import {
  getVolumes,
  getInstances,
  getSnapshots,
  getVpcs,
  filterByVpc,
  filterBySnapshotId
} from "../common";

type ListInUseVolumesConfig = {
  maxVolumes: number;
  region: string;
  out: string;
};

export const describe = "returns a list of in-use volumes";

export const builder = () =>
  yargs.options({
    "max-volumes": {
      describe: "restricts the maximum number of volumes to output",
      type: "number",
      default: 100000
    },
    region: {
      describe: "aws region",
      type: "string",
      default: "eu-west-1"
    },
    out: {
      describe: "path to output data in csv format",
      type: "string",
      default: ""
    }
  });

export const handler = async (argv: ListInUseVolumesConfig) => {
  const ec2 = new EC2({
    region: argv.region
  });

  const volumes = await getVolumes(ec2, [
    { Name: "status", Values: ["in-use"] }
  ]);

  const progressIndicator = createProgressIndicator();
  progressIndicator.start(Math.min(argv.maxVolumes, volumes.length), 0);

  const records = await composeAsync<object[]>(
    mapAsync<{ volumeId: string; instance: EC2.Reservation }>(
      async (vol: Volume) => {
        const instance = (
          await getInstances(ec2, [
            { Name: "instance-id", Values: [vol.Attachments![0].InstanceId!] }
          ])
        )[0];
        const [vpc, snapshots] = await Promise.all([
          getVpcs(ec2, filterByVpc([instance.VpcId!])).then(vpcs => vpcs[0]),
          getSnapshots(ec2, filterBySnapshotId([vol.SnapshotId!]))
        ]);

        progressIndicator.increment(1);
        return {
          VolumeId: vol.VolumeId,
          CreateTime: vol.CreateTime,
          instance: extractInstanceFacts(instance),
          vpc: extractVpcFacts(vpc),
          snapshot: extractSnapshotFacts(defaultTo({ Tags: [] }, snapshots[0]))
        };
      }
    ),
    take(argv.maxVolumes),
    filter<Volume>(propEq("State", "in-use"))
  )(volumes);

  progressIndicator.stop();
  if (argv.out) {
    const csvResult = await outputToCsv(records, argv.out);
    console.log(csvResult);
  } else {
    console.log(JSON.stringify(records, null, 2));
  }
  console.log("completed");
};

const tagOr = (defaultValue: string, tags?: EC2.TagList) => (key: string) => {
  const result = tags?.find(t => t.Key === key);
  return result?.Value || defaultValue;
};
const extractInstanceFacts = (instance?: EC2.Instance) => {
  if (instance) {
    const tag = tagOr("unspecified", instance.Tags);
    return {
      ServiceName: tag("ServiceName"),
      Environment: tag("Environment"),
      ServiceCatalogueId: tag("ServiceCatalogueId"),
      Name: tag("Name"),
      ...pick<string>(
        [
          "ImageId",
          "InstanceId",
          "InstanceType",
          "LaunchTime",
          "PublicIpAddress",
          "VpcId"
        ],
        instance as Dictionary<string>
      )
    };
  }
};
const extractVpcFacts = (vpc: EC2.Vpc) => {
  const tag = tagOr("unspecified", vpc.Tags);
  return {
    ServiceName: tag("ServiceName"),
    Environment: tag("Environment"),
    ServiceCatalogueId: tag("ServiceCatalogueId"),
    Name: tag("Name")
  };
};
const extractSnapshotFacts = (
  snapshot:
    | Pick<EC2.Snapshot, "SnapshotId" | "StartTime" | "State" | "Tags">
    | { Tags: EC2.TagList }
) => {
  const tag = tagOr("unspecified", snapshot.Tags);
  return {
    ...pick<string>(
      ["SnapshotId", "StartTime", "State"],
      snapshot as Dictionary<string>
    ),
    ServiceName: tag("ServiceName"),
    Environment: tag("Environment"),
    ServiceCatalogueId: tag("ServiceCatalogueId")
  };
};

const outputToCsv = (records: object[], outPath: string) =>
  new Promise((resolve, reject) => {
    stringify(
      records,
      {
        header: true,
        columns: [
          "VolumeId",
          "CreateTime",
          "instance.ServiceName",
          "instance.Environment",
          "instance.ServiceCatalogueId",
          "instance.Name",
          "instance.ImageId",
          "instance.InstanceId",
          "instance.InstanceType",
          "instance.LaunchTime",
          "instance.PublicIpAddress",
          "instance.VpcId",
          "vpc.ServiceName",
          "vpc.Environment",
          "vpc.ServiceCatalogueId",
          "vpc.Name",
          "snapshot.SnapshotId",
          "snapshot.StartTime",
          "snapshot.State",
          "snapshot.ServiceName",
          "snapshot.Environment",
          "snapshot.ServiceCatalogueId"
        ]
      },
      (err, data) => {
        if (err) return reject(err);
        writeFile(outPath, data, err => {
          if (err) return reject(err);
          resolve({ recordCount: records.length, out: outPath });
        });
      }
    );
  });

const createProgressIndicator = () =>
  new Bar(
    {
      barsize: 50
    },
    {
      ...Presets.shades_grey,
      format: `[{bar}] {percentage}% | {value}/{total} | {eta}s']`
    }
  );
