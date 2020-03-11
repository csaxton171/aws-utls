import { TagCollectionItem } from "../TagCollectionItem";
import { TagCollectorVisitor } from "../TagCollectorVisitor";
import { visitByVpc } from "../../../visitor";
import { difference, pick } from "rambdax";
import { TagSpecification } from "../index";

type PlanOptions = {
  accountInfo: { account: string | undefined; region: string };
  vpcId: string;
};
export const plan = async (options: PlanOptions, tagSpec: TagSpecification) => {
  const visitor = new TagCollectorVisitor(
    options.accountInfo.region,
    options.accountInfo.account
  );
  await visitByVpc(options.vpcId, visitor);
  const desiredTags = tagSpec.tags.map(t => ({
    Key: t.key,
    Value: `${t.value}`
  }));

  return visitor.result.map(subject => ({
    ...pick(["resourceId", "resourceArn", "type"], subject),
    changes: difference(desiredTags, subject.tags).map(entry => ({
      ...entry,
      action: "apply"
    }))
  }));
};
