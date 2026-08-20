import type { EWeLinkDevice } from "../../type/devices.ts";
import { uiidConfig } from "../../constants/uiid/index.ts";
import { config } from "../../config.ts";

// transform endpoints
export function buildEndpointUIID
    (info: EWeLinkDevice) {
    const { deviceid, name, params, brandName, productModel } = info;
    const { category, capabilities } = uiidConfig[productModel as keyof typeof uiidConfig]

    return {
        third_serial_number: deviceid,
        name,
        display_category: category,
        capabilities: paramsToIHostCapabilities(params, capabilities)!,
        state: paramsToIHostState(params),
        manufacturer: brandName || '',
        model: productModel || '',
        firmware_version: params?.fwVersion || '',
        service_address: `http://192.168.1.110:${config.port}/open-api/device/${deviceid}`,
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
            if (target) {
                params[paramKey] = target * 10;
            };
        }
    }

    return params;
}

export type Capabilities = {
    capability: string;
    permission: string;
    name?: string;
    settings?: Record<string, any>;
}[]

// eWeLink params → iHost capabilities
export function paramsToIHostCapabilities(params: { [key: string]: any }, capabilities?: Capabilities,) {
    let iHostCapabilities;
    if (capabilities) iHostCapabilities = capabilities;
    // weeklySchedule
    const daysMap: { [key: string]: string } = {
        mon: 'Monday', tues: 'Tuesday', wed: 'Wednesday', thur: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
    }
    let weeklyScheduleValue: { [key: string]: Array<{ startTimeInMinutes: number; upperSetpoint: number; lowerSetpoint: number }> } = {};
    function parseDay(d: string) {
        const result = [];
        for (let i = 0; i < 6; i++) {
            const offset = i * 8;
            const part = d.slice(offset, offset + 8);
            const startTimeInMinutes = parseInt(part.slice(0, 4), 16);
            const upperSetpoint = parseInt(part.slice(4, 8), 16) / 10;
            const lowerSetpoint = parseInt(part.slice(4, 8), 16) / 10;
            result.push({ startTimeInMinutes, upperSetpoint, lowerSetpoint });
        }
        return result;
    }
    for (const key in daysMap) {
        if (params[key] !== undefined) {
            const value = daysMap[key]
            weeklyScheduleValue[value] = parseDay(params[key]);
        }
    }
    if (capabilities) {
        const auto = iHostCapabilities!.find(c => c.capability === "thermostat-target-setpoint" && c.name === "auto-mode")!;
        auto.settings!.weeklySchedule.value = { ...auto.settings!.weeklySchedule.value, ...weeklyScheduleValue }
        return iHostCapabilities;
    } else {
        const auto = uiidConfig['TRVZB'].capabilities.find(c => c.name === 'auto-mode');
        if(!auto || ! auto.settings || !auto.settings.weeklySchedule || !auto.settings.weeklySchedule.value) return
        auto.settings.weeklySchedule.value = {...auto.settings.weeklySchedule.value, ...weeklyScheduleValue}
        return [auto]
    }
}

// iHost capabilities → eWeLink params
export function capabilitiesToParams(capabilities: Capabilities): { [key: string]: any } {
    const params: { [key: string]: any } = {};

    // weeklySchedule
    const auto = capabilities.find(
        c => c.capability === "thermostat-target-setpoint" && c.name === "auto-mode"
    );
    if (!auto?.settings?.weeklySchedule?.value) {
        return params;
    }
    const weeklyScheduleValue = auto.settings.weeklySchedule.value;
    const reverseDaysMap: Record<string, string> = {
        Monday: 'mon',
        Tuesday: 'tues',
        Wednesday: 'wed',
        Thursday: 'thur',
        Friday: 'fri',
        Saturday: 'sat',
        Sunday: 'sun'
    };

    // 编码单个日期的 6 个时间段为 48 位十六进制字符串
    function encodeDay(
        dayArray: Array<{ startTimeInMinutes: number; upperSetpoint: number; lowerSetpoint?: number }>
    ): string {
        let result = '';
        for (let i = 0; i < 6; i++) {
            const slot = dayArray[i] || { startTimeInMinutes: 0, upperSetpoint: 0, lowerSetpoint: 0 };
            const startHex = slot.startTimeInMinutes.toString(16).padStart(4, '0');
            const tempHex = Math.round(slot.upperSetpoint * 10).toString(16).padStart(4, '0');
            result += startHex + tempHex;
        }
        return result;
    }

    for (const [fullName, shortName] of Object.entries(reverseDaysMap)) {
        const dayData = weeklyScheduleValue[fullName];
        if (Array.isArray(dayData) && dayData.length > 0) {
            params[shortName] = encodeDay(dayData);
        }
    }

    return params;
}

