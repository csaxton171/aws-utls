import { TagCollectionItem } from "../TagCollectionItem";
import { TagCollectorVisitor } from "../TagCollectorVisitor";
import { visitByVpc } from "../../../visitor";
import { difference, pick } from "rambdax";
import { TagSpecification } from "../index";
import { GenericTag } from "../../../common";

type PlanOptions = {
  accountInfo: { account: string | undefined; region: string };
  vpcId: string;
};

/**
 * given a tag specification and a target vpc, generates a plan containing all the
 * various associated aws components and the proposed chnages
 * @param options various settings controlling the plan application
 * @param tagSpec specification to apply to the various aws components
 */
export const plan = async (options: PlanOptions, tagSpec: TagSpecification) => {
  const visitor = new TagCollectorVisitor(
    options.accountInfo.region,
    options.accountInfo.account
  );
  await visitByVpc({ ...options }, visitor);
  const desiredTags: GenericTag[] = tagSpec.tags.map(t => ({
    Key: t.key,
    Value: `${t.value}`
  }));

  return planFormatJson(
    visitor.result.filter(exclusivelyVpcOwnedComponentsOnly),
    desiredTags
  );
};

/**
 * indicates whether or not the supplied item is exclusively owned by the VPC or now
 * @param subject TagCollectionItem to inspect
 */
const exclusivelyVpcOwnedComponentsOnly = (subject: TagCollectionItem) =>
  !["Address"].includes(subject.type);

const planFormatJson = (
  tagCollectionItems: TagCollectionItem[],
  desiredTags: GenericTag[]
) =>
  tagCollectionItems
    .map(subject => ({
      ...pick(["resourceId", "resourceArn", "type"], subject),
      changes: difference(desiredTags, subject.tags).map(entry => ({
        ...entry,
        action: "apply"
      }))
    }))
    .filter(plan => plan.changes.length > 0);
