// 房间类型
export type RoomItem = {
  id: string;
  name: string;
  index: number;
};

// 家庭列表类型
export type FamilyItem = {
  id: string;
  apikey: string;
  name: string;
  index: number;
  roomList: RoomItem[];
  familyType: number;
  members: any[];
};

export type FamilyData = {
  familyList: FamilyItem[];
  currentFamilyId: string;
  hasChangedCurrentFamily: boolean;
};


export type PulseItem = {
  pulse: "on" | "off";
  width: number;
  outlet: number;
};

export type ConfigureItem = {
  startup: "on" | "off";
  outlet: number;
};

export type SwitchItem = {
  switch: "on" | "off";
  outlet: number;
};

export type DeviceParams = {
  bindInfos: Record<string, any>;
  version: number;
  bssid: string;
  sledOnline: "on" | "off";
  ssid: string;
  configure: ConfigureItem[];
  depc: number;
  epc1: number;
  epc2: number;
  epc3: number;
  exccause: number;
  excvaddr: number;
  fwVersion: string;
  init: number;
  lock: number;
  pulses: PulseItem[];
  rssi: number;
  rstReason: number;
  staMac: string;
  switches: SwitchItem[];
  TZ: string;
};

export type DeviceExtra = {
  [key: string]: string;
};

export type DeviceSettings = {
    [key: string]: number;
};

export type DeviceFamily = {
  familyid: string;
  index: number;
  members: any[];
  guests: any[];
  roomid?: string;
};

// 设备信息
export type DeviceItemData = {
  name: string;
  deviceid: string;
  apikey: string;
  extra: DeviceExtra;
  brandName: string;
  brandLogo: string;
  showBrand: boolean;
  productModel: string;
  tags: Record<string, any>;
  devConfig: Record<string, any>;
  settings: DeviceSettings;
  devGroups: any[];
  family: DeviceFamily;
  shareTo: any[];
  devicekey: string;
  online: boolean;
  params: DeviceParams;
  isSupportGroup: boolean;
  isSupportedOnMP: boolean;
  isSupportChannelSplit: boolean;
  deviceFeature: Record<string, any>;
  hasModelPic: boolean;
};

export type ThingListItem = {
  itemType: number;
  itemData: DeviceItemData;
  index: number;
};

export type ThingListData = {
  thingList: ThingListItem[];
  total: number;
};
