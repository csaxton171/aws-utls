import { Lambda } from "aws-sdk";
import { find, ifElse, isNil, compose, propEq, T, curry } from "rambdax";
import { GenericFilter, GenericTag } from "./index";

export type TaggableLambdaResource = "LambdaFunction";

export const getLambdaFunctions = async (
  lambda: Lambda,
  filters: GenericFilter[]
) => {
  const functions = (await lambda.listFunctions({}).promise()).Functions || [];

  const vpcFilter = compose(
    (fltr: GenericFilter | undefined) =>
      ifElse(isNil, T, onlyVpcFunctions(fltr!.Values)),
    find(propEq("Name", "vpc-id"))
  )(filters);

  return functions.filter(vpcFilter);
};

export const withLambdaTags = <T>(
  lambda: Lambda,
  getResourceArn: (args?: any) => string,
  resources: T[]
) =>
  Promise.all(
    resources.map(async res => {
      const rtags = await lambda
        .listTags({ Resource: getResourceArn(res) })
        .promise();
      return {
        ...res,
        tags: Object.entries(rtags?.Tags || {}).map(([k, v]) => ({
          Key: k,
          Value: v
        })) as GenericTag[]
      };
    })
  );

const onlyVpcFunctions = curry(
  (vpcIds: string[], f: Lambda.FunctionConfiguration) =>
    vpcIds.includes(f.VpcConfig?.VpcId || "")
);
