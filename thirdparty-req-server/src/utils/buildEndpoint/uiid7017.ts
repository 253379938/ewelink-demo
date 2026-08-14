import type { EWeLinkDevice } from "../../type/devices.ts";
import { uiidConfig } from "../../constants/uiid/index.ts";
import { config } from "../../config.ts";

// transform endpoints
export function buildEndpointUIID7017
    (info: EWeLinkDevice) {
    const { deviceid, name, extra, params, brandName, productModel } = info;
    const uiid = extra.uiid;
    const { category, capabilities } = uiidConfig[uiid as keyof typeof uiidConfig]

    return {
        third_serial_number: deviceid,
        name,
        display_category: category,
        capabilities,
        state: paramsToIHostState(params),
        manufacturer: brandName || '',
        model: productModel || '',
        firmware_version: params?.fwVersion || '',
        service_address: `http://192.168.1.113:${config.port}/open-api/device/${deviceid}`,
    };
}

// eWeLink params → iHost state
export function paramsToIHostState(params: { [key: string]: any }) {
    const iHostState: { [key: string]: any } = {};

    const workModeMap = { '0': 'MANUAL', '1': 'ECO', '2': 'AUTO' };
    if (params.workMode in workModeMap) {
        iHostState['thermostat'] = {
            'thermostat-mode': { thermostatMode: workModeMap[params.workMode as keyof typeof workModeMap] },
        };
    }

    const workStateMap = { '0': 'INACTIVE', '1': 'HEATING' };
    if (params.workState in workStateMap) {
        iHostState['thermostat']['adaptive-recovery-status'] =
            { adaptiveRecoveryStatus: workStateMap[params.workState as keyof typeof workStateMap] };
    }

    // 目标温度：eWelink / 10 = iHost ，4-35°C
    const man = params.manTargetTemp;
    const eco = params.ecoTargetTemp;
    const auto = params.autoTargetTemp;
    let targetSetpoints: { [key: string]: number } = {};
        if (man) targetSetpoints.manual = man;
        if (eco) targetSetpoints.eco = eco;
        if (auto) targetSetpoints.auto = auto;
    if (Object.keys(targetSetpoints).length !== 0) {
        const setpoint: { [key: string]: any } = {};
        for (const [mode, temp] of Object.entries(targetSetpoints)) {
            const value = temp / 10;
            if (value >= 4 && value <= 35) {
                setpoint[`${mode}-mode`] = { targetSetpoint: value };
            }
        }
        if (Object.keys(setpoint).length) {
            iHostState['thermostat-target-setpoint'] = setpoint;
        }
    }


    if (params.temperature && params.temperature !== null) iHostState['temperature'] = { temperature: params.temperature / 10 };
    if (params.subDevRssi && params.subDevRssi !== null) iHostState['rssi'] = { rssi: params.subDevRssi };

    return iHostState;
}

// iHost state → eWeLink params
export function stateToParams(state: { [key: string]: any }) {
    const params: { [key: string]: any } = {};

    // thermostat-mode → workMode
    const mode = state?.thermostat?.['thermostat-mode']?.thermostatMode;
    const modeMap: { [key: string]: string } = { MANUAL: '0', ECO: '1', AUTO: '2' };
    if (mode in modeMap) {
        params.workMode = modeMap[mode as keyof typeof modeMap];
    }

    // thermostat-target-setpoint
    const setpoints = state?.['thermostat-target-setpoint'];
    if (setpoints) {
        const setpointsMap: { [key: string]: string } = {
            'manual-mode': 'manTargetTemp',
            'eco-mode': 'ecoTargetTemp',
            'auto-mode': 'autoTargetTemp',
        };
        for (const [stateKey, paramKey] of Object.entries(setpointsMap)) {
            const target = setpoints[stateKey]?.targetSetpoint;
            params[paramKey] = target * 10;
        }
    }

    return params;
}
