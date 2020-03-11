import { RDS } from "aws-sdk";
import { applyPostFilters, GenericTag } from "./index";

export type TaggableRdsResource = "RdsDBCluster" | "RdsDBInstance";

export const getRdsDBClusters = async (rds: RDS, filters: RDS.FilterList) => {
  return (
    (await rds.describeDBClusters({ Filters: filters }).promise()).DBClusters ||
    []
  );
};

export const getRdsDBInstances = async (rds: RDS, filters: RDS.FilterList) => {
  return applyPostFilters(
    async filters =>
      (
        await rds
          .describeDBInstances({
            Filters: filters
          })
          .promise()
      ).DBInstances || [],
    filters,
    [
      "vpc-id",
      (values, dbi: RDS.DBInstance) =>
        values.includes(dbi.DBSubnetGroup?.VpcId || "")
    ]
  );
};

export const withRdsTags = <T>(
  rds: RDS,
  getResourceArn: (args?: any) => string,
  resources: T[]
) =>
  Promise.all(
    resources.map(async res => {
      const rtags = await rds
        .listTagsForResource({ ResourceName: getResourceArn(res) })
        .promise();
      return { ...res, tags: (rtags.TagList as GenericTag[]) || [] };
    })
  );

export const filterByRdsClusterId = (dbInstances: RDS.DBInstance[]) => {
  const clusterIds = dbInstances
    .filter(dbi => dbi.DBClusterIdentifier)
    .map(dbi => dbi.DBClusterIdentifier!);
  return {
    Name: "db-cluster-id",
    Values: clusterIds.length ? clusterIds : ["no-db-cluster-specified"]
  };
};
