import ECapability from "../../type/enum/ECapability.ts";
import ECategory from "../../type/enum/ECategory.ts";
import { permission } from "../permission/index.ts";

const defaultIHostDevice = {
    category: ECategory.THERMOSTAT,
    capabilities: [
        {
            capability: ECapability.THERMOSTAT_TARGET_SETPOINT,
            permission: permission["update-updated-configure"],
            name: 'manual-mode',
            settings: {
                temperatureUnit: {
                    type: 'enum',
                    permission: '11',
                    value: 'c',
                    values: ['c', 'f'],
                },
                temperatureRange: {
                    type: 'numeric',
                    permission: '01',
                    min: 4,
                    max: 35,
                    step: 0.5,
                },
            },
        },
        {
            capability: ECapability.THERMOSTAT_TARGET_SETPOINT,
            permission: permission["update-updated-configure"],
            name: 'eco-mode',
            settings: {
                temperatureUnit: {
                    type: 'enum',
                    permission: '11',
                    value: 'c',
                    values: ['c', 'f'],
                },
                temperatureRange: {
                    type: 'numeric',
                    permission: '01',
                    min: 4,
                    max: 35,
                    step: 0.5,
                },
            },
        },
        {
            capability: ECapability.THERMOSTAT_TARGET_SETPOINT,
            permission: permission["updated-configure"],
            name: 'auto-mode',
            settings: {
                temperatureUnit: {
                    type: 'enum',
                    permission: '01',
                    value: 'c',
                    values: ['c', 'f'],
                },
                temperatureRange: {
                    type: 'numeric',
                    permission: '01',
                    min: 4,
                    max: 35,
                    step: 0.5,
                },
                weeklySchedule: {
                    type: 'object',
                    permission: '11',
                    value: {
                        maxEntryPerDay: 6,
                        Sunday: [],
                        Monday: [],
                        Tuesday: [],
                        Wednesday: [],
                        Thursday: [],
                        Friday: [],
                        Saturday: [],
                    },
                },
            },
        },
        { capability: ECapability.THERMOSTAT, permission: permission.update, name: 'adaptive-recovery-status' },
        {
            capability: ECapability.THERMOSTAT,
            permission: permission["update-updated"],
            name: 'thermostat-mode',
            settings: {
                supportedModes: {
                    type: 'enum',
                    permission: '01',
                    values: ['MANUAL', 'AUTO', 'ECO'],
                },
            },
        },
        {
            capability: ECapability.TEMPERATURE,
            permission: permission["updated-configure"],
            settings: {
                temperatureRange: {
                    type: 'numeric',
                    permission: '01',
                    min: -40,
                    max: 80,
                },

                temperatureUnit: {
                    type: 'enum',
                    permission: '11',
                    value: 'c',
                    values: ['c', 'f'],
                },
                temperatureCalibration: {
                    type: 'numeric',
                    permission: '11',
                    min: -7, // 最小值
                    max: 7, // 最大值
                    step: 0.2, // 温度调节步长，单位同temperatureUnit
                    value: 0,
                },
            },
        },
        { capability: ECapability.RSSI, permission: permission.update },
        { capability: "child-lock", permission: permission["update-updated"] },
        { capability: "window-detection", permission: permission["update-updated"] }
    ],
};

export default defaultIHostDevice;
