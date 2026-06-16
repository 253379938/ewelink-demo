import { regionMap } from "./regionMap";
import { regionMapCN } from "./regionMap-cn";

export interface RegionInfo {
  region: string;
  code: string;
  regionAs: string;
}
const regionMapMergeFn = (): RegionInfo[] => {
  const cnMap = new Map<string, { [key: string]: string }>();
  regionMapCN.forEach((item: { [key: string]: string }) => {
    if (item.code) {
      cnMap.set(item.code, item);
    }
  });

  const result: RegionInfo[] = regionMap.map((item) => {
    const cnInfo = cnMap.get(item.countryCode) || {};

    return {
      regionAs: item.region,
      code: item.countryCode,
      region: cnInfo.name, 
    };
  });

  return result;
};

export const regionMapMerge = regionMapMergeFn();