const R = require("rambda");

var components = [
  "scheme",
  "partition",
  "service",
  "region",
  "owner",
  "resourceRaw"
];

export type Arn = {
  scheme: string;
  partition: string;
  service: string;
  region: string;
  owner: string;
  type: string;
  resourceId: string;
};

export const parseArnString = (arn: string): Arn => {
  const result = arn
    .split(":")
    .reduce(
      (parsedArn, value, i) =>
        R.set(R.lensProp(components[i]), value, parsedArn),
      { resourceRaw: "" }
    );

  const resourceInfo =
    result.resourceRaw.match(/(?<type>[^\/.]+)\/(?<resourceId>.*)$/m)?.groups ||
    {};

  return R.omit(["resourceRaw"], { ...result, ...resourceInfo });
};
