export type EWeLinkDevice = {
    name: string;
    deviceid: string;
    apikey: string;
    extra: {
        uiid: string;
        [key: string]: string;
    };
    brandName: string;
    brandLogo: string;
    showBrand: boolean;
    productModel: string;
    tags: {
        [key: string]: string;
    };
    devConfig: any;
    deviceConfigToApp: {
        otaTimeout: number;
    };
    family: {
        [key: string]: any;
    };
    shareTo: any;
    devicekey: string;
    online: boolean;
    denyFeatures: Array<string>;
    isSupportGroup: boolean,
    isSupportedOnMP: boolean,
    isSupportChannelSplit: boolean,
    deviceFeature: any,
    hasModelPic: boolean
    params: any;
}

export type IHostDevice = {
    third_serial_number: string;
    name: string;
    display_category: string;
    capabilities: {
        capability: string;
        permission: string;
        name?: string;
        settings?: Record<string, any>;
    }[];
    state: null | any;
    tags?: {
        deviceInfo: string;
    };
    firmware_version: string;
    service_address: string;
}

export type IHostReq = {
    event: {
        header: {
            name: string;
            message_id: string;
            version: string;
        };
        payload: {
            endpoints: IHostDevice[];
        };
    };
}