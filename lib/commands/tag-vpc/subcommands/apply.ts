import { TagPlan, TagPlanChange } from "../index";
import { EntityResource } from "../../../common";
import { groupBy } from "rambdax";

export type TagPlanResult = {
  changes: TagPlanChange &
    EntityResource & { status: "success" | "fail"; error?: Error };
};

export const apply = (plan: TagPlan[] | undefined) => {
  if (!plan?.length) {
    Promise.resolve({ changes: [] });
  }
  console.log("APPLY ---->", JSON.stringify(plan, null, 2));
  return Promise.resolve({ changes: [] });
};

// const changesByService = (changes: TagPlanChange[]) => {
//   groupBy(e => {
//     switch (e.) {
//       case value:
//         break;

//       default:
//         break;
//     }
//   }, changes)[("RdsDBCluster", "RdsDBInstance")];
// };
