import { TagCollectorVisitor } from "../TagCollectorVisitor";
import { visitByVpc, VisitResult } from "../../../visitor";

type CurrentOptions = {
  accountInfo: { account: string | undefined; region: string };
  vpcId: string;
};
export const current = (options: CurrentOptions): Promise<VisitResult[]> => {
  const visitor = new TagCollectorVisitor(
    options.accountInfo.region,
    options.accountInfo.account
  );
  return visitByVpc(options.vpcId, visitor);
};
