import { TagCollectorVisitor } from "../TagCollectorVisitor";
import { visitByVpc, VisitResult } from "../../../visitor";
export const current = (
  vpcId: string,
  accountInfo: { account: string | undefined; region: string }
): Promise<VisitResult[]> => {
  const visitor = new TagCollectorVisitor(
    accountInfo.region,
    accountInfo.account
  );
  return visitByVpc(vpcId, visitor);
};
