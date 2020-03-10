import { TagCollectionItem } from "../TagCollectionItem";
import { TagCollectorVisitor } from "../TagCollectorVisitor";
import { visitByVpc } from "../../../visitor";
import { difference, pick } from "rambdax";
import { TagSpecification } from "../index";

export const plan = async (
  tagSpec: TagSpecification,
  vpcId: string,
  accountInfo: { account: string | undefined; region: string }
) => {
  const visitor = new TagCollectorVisitor(
    accountInfo.region,
    accountInfo.account
  );
  await visitByVpc(vpcId, visitor);
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
