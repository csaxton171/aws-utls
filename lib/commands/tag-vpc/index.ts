import yargs from "yargs";
import { STS } from "aws-sdk";
import { readFileSync } from "fs";
import { safeLoad } from "js-yaml";
import { TaggableResource, EntityResource, GenericTag } from "../../common";
import { apply, current, plan } from "./subcommands";

export type TagSpecification = {
  tags: {
    key: string;
    value?: string;
  }[];
};

export type TagPlan = {
  type: TaggableResource;
  changes: TagPlanChange[];
} & EntityResource;

export type TagPlanChange = { action: "apply" } & GenericTag;

type TagVpcConfig = {
  command: "current" | "plan" | "apply";
  vpcId: string;
  region: string;
  tagSpec: TagSpecification;
  tagPlan?: TagPlan[];
};

export const command = "tag-vpc <command>";

export const describe = "tags selected vpc and all associated components";

export const builder = () =>
  yargs
    .positional("command", {
      describe: "the command you wish to execute",
      choices: ["current", "plan", "apply"]
    })
    .options({
      "vpc-id": {
        describe: "vpc id to start the crawl with",
        type: "string"
      },
      "tag-spec": {
        describe:
          "path to a valid tag specification file ( used to produce a tag plan )",
        type: "string"
      },
      "tag-plan": {
        describe:
          "path to a valid tag plan file ( typically generated by the 'plan' command )",
        type: "string"
      },
      region: {
        describe: "aws region",
        type: "string",
        default: "eu-west-1"
      }
    })
    .check(config => {
      [
        { commands: ["current", "plan"], optionName: "vpc-id" },
        { commands: ["plan"], optionName: "tag-spec" },
        { commands: ["apply"], optionName: "tag-plan" }
      ].forEach(({ commands, optionName }) => {
        if (commands.includes(config.command!) && !config[optionName]) {
          throw new Error(`Missing required argument: ${optionName}`);
        }
      });
      return true;
    })
    .coerce({
      tagSpec: toTagSpec,
      tagPlan: toTagPlan
    });

export const handler = async (argv: TagVpcConfig) => {
  const accountInfo = await getAccountInfo(argv.region);

  switch (argv.command) {
    case "current":
      dump(await current(argv.vpcId, accountInfo));
      break;

    case "plan":
      dump(await plan(argv.tagSpec, argv.vpcId, accountInfo));
      break;

    case "apply":
      dump(await apply(argv.tagPlan));
      break;
  }
};

const dump = (value: object, label?: string) =>
  console.log(label || "", JSON.stringify(value, null, 2));

const getAccountInfo = (region: string) =>
  new STS()
    .getCallerIdentity()
    .promise()
    .then(res => {
      const { Account: account, Arn: userArn } = res;
      return { region: region, account, userArn };
    });

const toTagSpec = (value: string) => {
  if (/ya?ml$/im.test(`${value}`.trim())) {
    return safeLoad(readFileSync(value, "utf-8")) as TagSpecification;
  }
  throw new Error(`expected path to yaml tag-spec file [${value}]`);
};

const toTagPlan = (value: string) => {
  if (/\.json$/im.test(`${value}`.trim())) {
    return JSON.parse(readFileSync(value, "utf-8")) as TagPlan[];
  }
  throw new Error(`expected path to json tag plan file [${value}]`);
};
