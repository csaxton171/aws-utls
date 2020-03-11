import { TagPlan, TagPlanChange } from "../index";
import { EntityResource } from "../../../common";
import { groupBy, curry, omit, pick } from "rambdax";
import { parseArnString } from "../../../arn";
import { EC2, RDS } from "aws-sdk";
import hash from "object-hash";

type ApplyTags = (plans: TagPlan[]) => Promise<TagPlanResult[]>;

type TagPlanChangeState = {
  status: "success" | "fail" | "unknown";
  error?: Error;
};
export type TagPlanResult = TagPlanChange & EntityResource & TagPlanChangeState;

type ApplyOptions = {
  accountInfo: { account: string | undefined; region: string };
  dryRun: boolean;
};
export const apply = (options: ApplyOptions, plan: TagPlan[] | undefined) => {
  if (!plan?.length) {
    return Promise.resolve([]);
  }
  const {
    dryRun,
    accountInfo: { region }
  } = options;

  if (!dryRun) {
    throw new Error("not yet man");
  }

  const applyTagMapping = new Map<string, ApplyTags>([
    ["ec2", applyTagsEc2(new EC2({ region }))(dryRun)],
    ["rds", applyTagsRds(new RDS({ region }))(dryRun)]
  ]);

  const servicePlans = Object.entries(groupBy(serviceGrouping)(plan));

  return Promise.all(
    servicePlans.map(([service, plans]) => {
      const fn = applyTagMapping.get(service);
      return fn
        ? fn(plans)
        : Promise.reject(
            new Error(`no applyTagMapping found for service '${service}'`)
          );
    })
  );

  // console.log(servicePlans);

  // console.log(">>>>>", JSON.stringify(servicePlans, null, 2));
  // console.log("APPLY ---->", JSON.stringify(plan, null, 2));
  // return Promise.resolve({ changes: [] });
};

const serviceGrouping = (planItem: TagPlan) => {
  const serviceFromArn =
    planItem.resourceArn && parseArnString(planItem.resourceArn);

  if (serviceFromArn) {
    return serviceFromArn.service.toLowerCase();
  }
  const typeServiceMapping: [RegExp, string][] = [
    [/^(Address|EgressOnlyInternetGateway|NatGateway)$/m, "ec2"],
    [/^Rds/m, "rds"],
    [/^s3/m, "s3"],
    [/^iam/m, "iam"],
    [/^ssm/m, "ssm"],
    [/^sqs/m, "sqs"],
    [/^sns/m, "sns"]
  ];
  const [, serviceFromType] = typeServiceMapping.find(([rex, service]) =>
    rex.test(planItem.type)
  ) || [,];
  if (serviceFromType) {
    return serviceFromType;
  }

  throw new Error(
    `unable to resolve service from plan '${planItem.resourceId}' of type '${planItem.type}'`
  );
};

const applyTagsEc2 = curry(
  (ec2: EC2, dryRun: boolean, plans: readonly TagPlan[]) => {
    // console.log("applyTagsEc2 >>>", plans);

    // TODO rewrite this to batch calls and be more efficient across the wire :)
    return Promise.all(
      plans.map(plan =>
        ec2
          .createTags({
            Resources: [plan.resourceId],
            Tags: plan.changes.map(omit(["action"])),
            DryRun: dryRun
          })
          .promise()
          .then(dunno => {
            console.log(
              "[applyTagsEc2] dunno-success",
              JSON.stringify(dunno, null, 2)
            );
            return toTagPlanResults(plan, { status: "success" });
          })
          .catch(error => {
            const state: TagPlanChangeState =
              error.code === "DryRunOperation" &&
              /would\shave\ssucceeded/i.test(error.message)
                ? { status: "success" }
                : { status: "fail", error };

            return toTagPlanResults(plan, state);
          })
      )
    ).then(res => res.flat());
  }
);

const applyTagsRds = curry((rds: RDS, dryRun: boolean, plans: TagPlan[]) => {
  return Promise.all(
    plans.map(plan =>
      dryRun
        ? toTagPlanResults(plan, {
            status: "unknown",
            error: new Error("dry-run not supported in RDS")
          })
        : rds
            .addTagsToResource({
              ResourceName: plan.resourceArn!,
              Tags: plan.changes.map(omit(["action"]))
            })
            .promise()
            .then(result => {
              console.log("dunno-success", JSON.stringify(result, null, 2));
              return toTagPlanResults(plan, { status: "success" });
            })
            .catch(error => {
              console.log("dunno-error", JSON.stringify(error, null, 2));
              return toTagPlanResults(plan, { status: "fail", error });
            })
    )
  ).then(res => res.flat());
});

const toTagPlanResults = (
  plan: TagPlan,
  state: TagPlanChangeState
): TagPlanResult[] =>
  plan.changes.map(
    c =>
      ({
        ...pick(["resourceId", "resourceArn"], plan),
        ...c,
        ...state
      } as TagPlanResult)
  );
