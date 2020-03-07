import yargs from "yargs";
import { EC2 } from "aws-sdk";
import { getVolumes } from "../common";
import { toPairs, fromPairs } from "rambdax";

type StatsConfig = {
  region: string;
};

export const describe = "displays summary volume information";

export const builder = () =>
  yargs.options({
    region: {
      describe: "aws region",
      type: "string",
      default: "eu-west-1"
    }
  });

export const handler = async (argv: StatsConfig) => {
  const ec2 = new EC2({
    region: argv.region
  });

  const result = await getVolumes(ec2, [
    { Name: "status", Values: ["available", "in-use"] }
  ]);

  const stats = result.reduce(
    (stats, volume) => {
      stats.total++;
      stats.status = incrementProp(stats.status, volume.State!, 1);
      stats.size = incrementProp(stats.size, volume.Size!.toString(), 1);
      stats.volumeType = incrementProp(stats.volumeType, volume.VolumeType!, 1);
      return stats;
    },
    {
      total: 0,
      status: {},
      volumeType: {},
      size: {}
    }
  );
  console.log(JSON.stringify(stats, null, 2));
};

const incrementProp = <T extends { [k: string]: number }>(
  obj: T,
  prop: string,
  value: number
) => {
  const variants = toPairs(obj);
  let accum = variants.find(([name]) => name === prop);
  if (!accum) {
    accum = variants[variants.push([prop, 0]) - 1];
  }
  accum[1] = accum[1] + value;
  return fromPairs(variants);
};
